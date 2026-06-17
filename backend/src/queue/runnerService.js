import prisma from '../config/db.js';
import redis from '../config/redis.js';
import { enqueueCampaign } from './campaignQueue.js';

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

    // Simulate progress in chunks
    let progress = campaign.progress;
    let findings = campaign.findings;

    while (progress < 100) {
      // Wait for a short interval (e.g. 500ms) to simulate real work
      await new Promise((resolve) => setTimeout(resolve, 500));

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

      // Simulate step progress
      progress += 20;
      if (progress > 100) progress = 100;

      // Simulate finding generation (30% chance at each step)
      if (Math.random() < 0.3) {
        findings += 1;
      }

      // Simulate failure scenario for retries:
      // If campaign ID contains "fail" and it is currently at progress 60%, throw an error
      if (campaignId.includes('fail') && progress === 60) {
        throw new Error('Simulated network scanning failure.');
      }

      // Update campaign progress & findings in database
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { progress, findings }
      });

      console.log(`[Runner] Campaign ${campaignId} progress: ${progress}%, findings: ${findings}`);
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
