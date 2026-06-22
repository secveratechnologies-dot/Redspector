import prisma from '../config/db.js';

/**
 * Calculates asset criticality rating on a 1-10 scale.
 * 
 * @param {Object} asset
 * @returns {number} Criticality score from 1 to 10
 */
export const calculateAssetCriticality = (asset) => {
  let base = 5;
  if (asset.risk === 'High') base = 8;
  else if (asset.risk === 'Medium') base = 5;
  else if (asset.risk === 'Low') base = 2;

  let adjustment = 0;
  if (asset.type === 'Cloud Asset' || asset.type === 'API') adjustment = 2;
  else if (asset.type === 'IP' || asset.type === 'Domain') adjustment = 1;

  return Math.min(10, Math.max(1, base + adjustment));
};

/**
 * Resolves global CVE records for a list of CVE IDs from Prisma.
 * 
 * @param {Array<string>} cveIds
 * @returns {Promise<Map<string, Object>>} Map of CVE ID to database record
 */
export const fetchCveData = async (cveIds) => {
  if (!cveIds || cveIds.length === 0) return new Map();
  try {
    const records = await prisma.cve.findMany({
      where: { cveId: { in: cveIds } }
    });
    const map = new Map();
    records.forEach(r => map.set(r.cveId, r));
    return map;
  } catch (error) {
    console.error('[RiskService] Error fetching CVEs:', error.message);
    return new Map();
  }
};

/**
 * Main engine function to compute risk metrics over assets and findings.
 * 
 * @param {Object} params
 * @param {Array} params.assets
 * @param {Array} params.findings
 * @param {string} params.tenantId
 * @returns {Promise<Object>} Calculated risk metrics
 */
export const calculateRiskMetrics = async ({ assets, findings, tenantId }) => {
  // Collect all CVE IDs across assets
  let allCveIds = [];
  assets.forEach(a => {
    if (a.cves && Array.isArray(a.cves)) {
      allCveIds = allCveIds.concat(a.cves);
    }
  });
  allCveIds = [...new Set(allCveIds)];

  // Fetch CVE reference data from DB
  const cveMap = await fetchCveData(allCveIds);

  const activeFindings = findings.filter(f => f.status === 'Open' || f.status === 'Verified');
  
  const findingRisks = [];
  
  for (const finding of activeFindings) {
    // Find matching asset by name or ID (case-insensitive)
    const asset = assets.find(
      a => (a.name && a.name.toLowerCase() === finding.asset.toLowerCase()) || 
           (a.id && a.id.toLowerCase() === finding.asset.toLowerCase())
    );
    
    const criticality = asset ? calculateAssetCriticality(asset) : 5;
    
    let baseThreat = 5.0;
    if (finding.severity === 'Critical') baseThreat = 9.5;
    else if (finding.severity === 'High') baseThreat = 7.5;
    else if (finding.severity === 'Medium') baseThreat = 5.0;
    else if (finding.severity === 'Low') baseThreat = 2.5;
    else if (finding.severity === 'Info') baseThreat = 0.0;
    
    let cvss = 0.0;
    let epss = 0.0;
    
    // If the finding is associated with an asset that has CVEs, resolve their threat details
    if (asset && asset.cves && asset.cves.length > 0) {
      let maxCvss = 0.0;
      let maxEpss = 0.0;
      asset.cves.forEach(cveId => {
        const cveData = cveMap.get(cveId);
        if (cveData) {
          if (cveData.cvss > maxCvss) maxCvss = cveData.cvss;
          if (cveData.epss > maxEpss) maxEpss = cveData.epss;
        }
      });
      cvss = maxCvss;
      epss = maxEpss;
    }
    
    let findingThreat = baseThreat;
    if (cvss > 0) {
      findingThreat = (baseThreat + cvss) / 2.0;
    }
    
    const likelihoodFactor = 1.0 + (epss * 0.5);
    
    // Scale risk by asset criticality (out of 10)
    const findingRisk = findingThreat * likelihoodFactor * (criticality / 10.0) * 10.0;
    
    findingRisks.push({
      findingId: finding.id,
      title: finding.title,
      asset: finding.asset,
      severity: finding.severity,
      criticality,
      findingRisk: parseFloat(findingRisk.toFixed(2))
    });
  }

  // Calculate aggregated risk score
  let riskScore = 0.0;
  if (findingRisks.length > 0) {
    const maxRisk = Math.max(...findingRisks.map(r => r.findingRisk));
    const countFactor = Math.min(15, (findingRisks.length - 1) * 2.5);
    riskScore = Math.min(100.0, maxRisk + countFactor);
  }
  
  riskScore = parseFloat(riskScore.toFixed(1));

  let severity = 'Low';
  if (riskScore >= 85) severity = 'Critical';
  else if (riskScore >= 70) severity = 'High';
  else if (riskScore >= 40) severity = 'Medium';

  const businessImpact = severity;

  // Compile severity counters
  const criticalFindingsCount = activeFindings.filter(f => f.severity === 'Critical').length;
  const highFindingsCount = activeFindings.filter(f => f.severity === 'High').length;
  const mediumFindingsCount = activeFindings.filter(f => f.severity === 'Medium').length;
  const lowFindingsCount = activeFindings.filter(f => f.severity === 'Low').length;

  return {
    riskScore,
    severity,
    businessImpact,
    stats: {
      totalAssetsCount: assets.length,
      activeFindingsCount: activeFindings.length,
      findingRisksDetails: findingRisks,
      summary: {
        critical: criticalFindingsCount,
        high: highFindingsCount,
        medium: mediumFindingsCount,
        low: lowFindingsCount
      }
    }
  };
};
