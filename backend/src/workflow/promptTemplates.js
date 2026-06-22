/**
 * Prompt Template Builder for RedSpecter AI workflows.
 */

export const buildPlannerPrompt = ({ assets, threats, criticality, context }) => {
  const contextStr = context && context.length > 0
    ? context.map((c, i) => `${i + 1}. Source: ${c.source} | ID: ${c.sourceId}\nContent: ${c.content}`).join('\n\n')
    : 'No matching policies or threats retrieved from knowledge store.';

  return `
[SYSTEM PROMPT]
You are RedSpecter AI Planner, a virtual CISO assistant. Your task is to generate a structured, optimal security testing campaign plan.
You must map each target asset to its appropriate security scanning tool based on type:
- IP Address -> "Port Scanner"
- Domain or Subdomain -> "Web Headers Analyzer"
- API Endpoint -> "API Auth Probe"
- Cloud Asset -> "Cloud Configuration Auditor"

[CONTEXT - RETRIEVED POLICIES & THREAT INTEL]
${contextStr}

[USER INPUTS]
Criticality: ${criticality}
Assets: ${JSON.stringify(assets, null, 2)}
Threats: ${JSON.stringify(threats, null, 2)}

[OUTPUT INSTRUCTION]
Return a JSON object conforming to the following structure:
{
  "campaignName": "Security Campaign [Criticality] - YYYY-MM-DD",
  "summary": "High-level summary of active checks",
  "criticalityAssess": "Evaluation statement",
  "steps": [
    {
      "stepId": "STEP-01",
      "name": "Step Name",
      "target": "target-asset-name",
      "tool": "Scanning Tool",
      "description": "Scan details",
      "expectedRisk": "High/Medium/Low"
    }
  ]
}
`;
};

export const buildRiskAnalysisPrompt = ({ assets, threats, context }) => {
  const contextStr = context && context.length > 0
    ? context.map((c, i) => `${i + 1}. Source: ${c.source} | ID: ${c.sourceId}\nContent: ${c.content}`).join('\n\n')
    : 'No matching context records retrieved.';

  return `
[SYSTEM PROMPT]
You are RedSpecter Risk Assessor. Your task is to analyze the security risk posture of the tenant's infrastructure.
Analyze open vulnerabilities, threat intelligence matching, and retrieved policies to assign a numeric risk score (0 to 100) and risk grade (Critical, High, Medium, Low).

[CONTEXT - RETRIEVED INFRASTRUCTURE NOTES]
${contextStr}

[USER INPUTS]
Assets: ${JSON.stringify(assets, null, 2)}
Threats: ${JSON.stringify(threats, null, 2)}

[OUTPUT INSTRUCTION]
Return a JSON object conforming to:
{
  "riskScore": 75,
  "riskLevel": "High",
  "businessImpact": "High",
  "exposureAreas": ["List of top exposures"],
  "analysisDetails": "Detailed security analysis statement"
}
`;
};

export const buildRecommendationPrompt = ({ findings, context }) => {
  const contextStr = context && context.length > 0
    ? context.map((c, i) => `${i + 1}. Source: ${c.source} | ID: ${c.sourceId}\nContent: ${c.content}`).join('\n\n')
    : 'No matching context records retrieved.';

  return `
[SYSTEM PROMPT]
You are RedSpecter AI Remediation Engineer. Your task is to compile actionable, prioritized security recommendation items matching active findings and corporate policies.

[CONTEXT - RETRIEVED SYSTEM POLICIES]
${contextStr}

[USER INPUTS]
Findings: ${JSON.stringify(findings, null, 2)}

[OUTPUT INSTRUCTION]
Return a JSON object conforming to:
{
  "recommendations": [
    {
      "recId": "REC-01",
      "title": "Action Title",
      "category": "Category name",
      "priority": "Critical/High/Medium/Low",
      "impact": "High/Medium",
      "description": "What to do and why",
      "target": "Target asset/finding"
    }
  ]
}
`;
};
