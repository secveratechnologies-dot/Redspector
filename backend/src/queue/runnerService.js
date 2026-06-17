import prisma from '../config/db.js';
import redis from '../config/redis.js';
import { enqueueCampaign } from './campaignQueue.js';
import { scanPorts, scanWebHeaders, scanApi } from '../security/scanner.js';

const MAX_RETRIES = 3;

export const executeCampaign = async (campaignId) => {
  console.log(`[Runner] Starting execution for campaign: ${campaignId}`);

  try {
    // Fetch campaign
    let campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      console.log(`[Runner] Campaign ${campaignId} not found. Skipping.`);
      return;
    }

    // Tenant check
    const tenant = await prisma.tenant.findUnique({
      where: { id: campaign.tenantId }
    });

    if (!tenant || tenant.status === 'Suspended') {
      console.log(`[Runner] Tenant suspended or not found for campaign ${campaignId}. Skipping.`);
      return;
    }

    // Set campaign status to Running
    campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'Running' }
    });

    // Fetch assets belonging to this tenant
    const assets = await prisma.asset.findMany({
      where: { tenantId: campaign.tenantId }
    });

    let progress = campaign.progress;
    let findings = campaign.findings;

    if (assets.length === 0) {
      console.log(`[Runner] No assets found for tenant ${campaign.tenantId}. Simulating quick scan.`);
      while (progress < 100) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        progress += 50;
        if (progress > 100) progress = 100;
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { progress }
        });
      }
    } else {
      const progressPerAsset = Math.floor((100 - progress) / assets.length);
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        console.log(`[Runner] Scanning asset ${asset.id} (${asset.type}): ${asset.name}`);

        // Refresh campaign status to check if it has been paused or stopped by the user
        const currentCampaign = await prisma.campaign.findUnique({
          where: { id: campaignId }
        });

        if (!currentCampaign) {
          console.log(`[Runner] Campaign ${campaignId} deleted during execution.`);
          return;
        }

        if (currentCampaign.status === 'Paused') {
          console.log(`[Runner] Campaign ${campaignId} was paused. Stopping worker loop.`);
          return;
        }

        if (currentCampaign.status === 'Completed' || currentCampaign.status === 'Failed') {
          console.log(`[Runner] Campaign ${campaignId} reached a terminal state externally.`);
          return;
        }

        let assetFindings = [];

        // Run scans based on asset type
        if (asset.type === 'IP') {
          const openPorts = await scanPorts(asset.name);
          if (openPorts.length > 0) {
            assetFindings.push({
              title: 'Exposed Network Services & Open Ports',
              severity: 'Medium',
              description: `A port scan discovered open network services on host ${asset.name}. Exposed services increase attacker exposure.`,
              evidence: `Open Ports:\n` + openPorts.map(p => `  - Port ${p.port}: ${p.service}`).join('\n'),
              recommendations: 'Disable unused services, bind databases to local address (127.0.0.1) only, and configure firewalls.'
            });
          }
        } else if (asset.type === 'Domain' || asset.type === 'Subdomain') {
          const webVulns = await scanWebHeaders(asset.name);
          assetFindings = assetFindings.concat(webVulns);
        } else if (asset.type === 'API') {
          const apiVulns = await scanApi(asset.name);
          assetFindings = assetFindings.concat(apiVulns);
        }

        // Write findings to database
        for (const vuln of assetFindings) {
          const fndId = `FND-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await prisma.finding.create({
            data: {
              id: fndId,
              title: vuln.title,
              severity: vuln.severity,
              asset: asset.name,
              status: 'Open',
              owner: asset.owner || 'SecOps',
              description: vuln.description,
              evidence: vuln.evidence,
              recommendations: vuln.recommendations,
              tenantId: campaign.tenantId
            }
          });
        }

        findings += assetFindings.length;
        progress += progressPerAsset;
        if (i === assets.length - 1) progress = 100;

        // Simulate failure retry trigger if the campaign ID has "fail"
        if (campaignId.includes('fail') && i === 0) {
          throw new Error('Simulated network scanning failure during scan step.');
        }

        // Update campaign progress & findings in database
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { progress, findings }
        });

        console.log(`[Runner] Asset ${asset.id} scan complete. Progress: ${progress}%, total findings: ${findings}`);
      }
    }

    // Finalize campaign execution
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'Completed' }
    });
    console.log(`[Runner] Campaign ${campaignId} completed successfully.`);

  } catch (error) {
    console.error(`[Runner Error] Failed during execution of campaign ${campaignId}:`, error.message);
    await handleJobFailure(campaignId);
  }
};

const handleJobFailure = async (campaignId) => {
  try {
    if (!redis) {
      console.error('[Runner] Redis offline. Cannot handle job retry.');
      return;
    }
    // Get attempts count from Redis
    const attemptsKey = `job:attempts:${campaignId}`;
    let attempts = await redis.get(attemptsKey);
    attempts = attempts ? parseInt(attempts, 10) : 1;

    if (attempts < MAX_RETRIES) {
      console.log(`[Runner] Campaign ${campaignId} failed. Retry attempt ${attempts}/${MAX_RETRIES - 1}. Re-enqueuing...`);
      // Update attempts
      await redis.set(attemptsKey, attempts + 1);
      // Re-enqueue
      await enqueueCampaign(campaignId);
    } else {
      console.log(`[Runner] Campaign ${campaignId} failed. Max retries reached.`);
      // Clear attempts
      await redis.del(attemptsKey);
      // Update status to Failed
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'Failed' }
      });
    }
  } catch (err) {
    console.error(`[Runner Error] Error handling failure state for ${campaignId}:`, err.message);
  }
};
