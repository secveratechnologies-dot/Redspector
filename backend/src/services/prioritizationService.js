import prisma from '../config/db.js';
import { calculateAssetCriticality, fetchCveData } from './riskService.js';

/**
 * Prioritizes active findings for a tenant.
 * Ranks findings based on finding severity, asset exposure criticality,
 * and vulnerability thread intelligence (CVSS, EPSS, and KEV status).
 * 
 * @param {Object} params
 * @param {Array} params.assets
 * @param {Array} params.findings
 * @param {string} params.tenantId
 * @returns {Promise<Array>} Prioritized Remediation Queue
 */
export const prioritizeFindings = async ({ assets, findings, tenantId }) => {
  // Collect all CVE IDs across assets
  let allCveIds = [];
  assets.forEach(a => {
    if (a.cves && Array.isArray(a.cves)) {
      allCveIds = allCveIds.concat(a.cves);
    }
  });
  allCveIds = [...new Set(allCveIds)];

  // Fetch global CVE references
  const cveMap = await fetchCveData(allCveIds);

  const activeFindings = findings.filter(f => f.status === 'Open' || f.status === 'Verified');

  const prioritizedList = [];

  for (const finding of activeFindings) {
    // Find matching asset
    const asset = assets.find(
      a => (a.name && a.name.toLowerCase() === finding.asset.toLowerCase()) || 
           (a.id && a.id.toLowerCase() === finding.asset.toLowerCase())
    );

    const criticality = asset ? calculateAssetCriticality(asset) : 5;

    // 1. Base Score based on severity
    let baseScore = 45;
    if (finding.severity === 'Critical') baseScore = 90;
    else if (finding.severity === 'High') baseScore = 70;
    else if (finding.severity === 'Medium') baseScore = 45;
    else if (finding.severity === 'Low') baseScore = 20;
    else if (finding.severity === 'Info') baseScore = 5;

    // 2. Criticality Adjustment
    const criticalityAdjustment = (criticality - 5) * 3;

    // 3. Threat Intel / CVSS / EPSS / KEV adjustments
    let cvssAdjustment = 0;
    let epssAdjustment = 0;
    let hasKev = false;

    if (asset && asset.cves && asset.cves.length > 0) {
      let maxCvss = 0.0;
      let maxEpss = 0.0;
      
      asset.cves.forEach(cveId => {
        const cveData = cveMap.get(cveId);
        if (cveData) {
          if (cveData.cvss > maxCvss) maxCvss = cveData.cvss;
          if (cveData.epss > maxEpss) maxEpss = cveData.epss;
          if (cveData.isKev) hasKev = true;
        }
      });

      if (maxCvss > 0) {
        cvssAdjustment = (maxCvss - 5.0) * 2;
      }
      epssAdjustment = maxEpss * 15;
    }

    let rawScore = baseScore + criticalityAdjustment + cvssAdjustment + epssAdjustment;
    if (hasKev) {
      rawScore += 15; // KEV acceleration bonus
    }

    // Clamp score
    const priorityScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    // 4. Action Grading
    let action = 'Monitor';
    if (priorityScore >= 75 || finding.severity === 'Critical' || (hasKev && asset && asset.risk === 'High')) {
      action = 'Fix First';
    } else if (priorityScore >= 40) {
      action = 'Fix Later';
    }

    prioritizedList.push({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      asset: finding.asset,
      status: finding.status,
      owner: finding.owner,
      priorityScore,
      action,
      details: {
        assetCriticality: criticality,
        hasKev,
        cvssAdjustment: parseFloat(cvssAdjustment.toFixed(1)),
        epssAdjustment: parseFloat(epssAdjustment.toFixed(1))
      }
    });
  }

  // Sort descending by priority score
  prioritizedList.sort((a, b) => b.priorityScore - a.priorityScore);

  return prioritizedList;
};
export default prioritizeFindings;
