import { generateRecommendationDetails } from './aiRecommendationService.js';

/**
 * Dispatcher for all AI insight types.
 * Delegates to the appropriate service based on insight type.
 *
 * @param {Object} params
 * @param {string} params.type - Insight type: recommendation | attackPath | threatAnalysis | riskExplanation | executiveInsights
 * @param {Object} params.payload - Optional data payload
 * @param {string} params.tenantId - Tenant isolation context
 * @returns {Promise<Object>} AI-generated insight data
 */
export const generateAiInsights = async ({ type, payload = {}, tenantId }) => {
  switch (type) {
    case 'recommendation': {
      const { findingId, finding } = payload;
      return generateRecommendationDetails({ findingId, finding, tenantId });
    }

    case 'attackPath': {
      // Attack path stub: returns simulated multi-hop lateral movement chains
      return {
        paths: [
          {
            step: 1,
            node: 'External Recon',
            technique: 'T1590 - Gather Victim Network Information',
            severity: 'Info',
          },
          {
            step: 2,
            node: payload.asset || 'Internet-Facing Asset',
            technique: 'T1190 - Exploit Public-Facing Application',
            severity: 'Critical',
          },
          {
            step: 3,
            node: 'Internal Network Pivot',
            technique: 'T1021 - Remote Services Lateral Movement',
            severity: 'High',
          },
          {
            step: 4,
            node: 'Data Exfiltration',
            technique: 'T1041 - Exfiltration Over C2 Channel',
            severity: 'Critical',
          },
        ],
        summary: 'Adversary could leverage the identified vulnerability to gain initial access and pivot to internal assets.',
      };
    }

    case 'threatAnalysis': {
      return {
        activeThreatGroups: ['APT29', 'Lazarus Group'],
        targetedTechnologies: payload.technologies || ['Node.js', 'PostgreSQL', 'AWS S3'],
        riskLevel: 'High',
        mitreTactics: ['Initial Access', 'Credential Access', 'Lateral Movement', 'Exfiltration'],
        recommendation: 'Prioritize patching externally accessible services and enable MFA across all admin accounts.',
      };
    }

    case 'riskExplanation': {
      const score = payload.riskScore ?? 0;
      const level = score >= 70 ? 'High' : score >= 35 ? 'Medium' : 'Low';
      return {
        score,
        level,
        plainLanguage: `Your current risk score of ${score} is classified as ${level}. ` +
          (level === 'High'
            ? 'Immediate action is required. Critical and high severity vulnerabilities are present on assets that could result in a breach.'
            : level === 'Medium'
            ? 'Your environment has moderate risk. Some vulnerabilities need attention to prevent escalation.'
            : 'Your security posture is generally healthy. Continue regular scanning and monitoring.'),
        topDrivers: ['Unpatched critical CVEs on cloud assets', 'Open high-severity findings', 'High asset criticality exposure'],
      };
    }

    case 'executiveInsights': {
      return {
        headline: 'Security posture requires executive attention.',
        keyRisks: [
          'Critical vulnerabilities present on internet-exposed assets.',
          'High proportion of open findings with no remediation SLA.',
          'Cloud infrastructure risk remains elevated.',
        ],
        recommendations: [
          'Enforce mandatory remediation SLAs for Critical and High severity findings.',
          'Schedule quarterly penetration testing for external assets.',
          'Invest in automated patch management tooling.',
        ],
        metrics: {
          overallRisk: payload.riskScore ?? 'N/A',
          complianceHealth: payload.complianceScore ?? 'N/A',
          openFindings: payload.openFindings ?? 'N/A',
        },
      };
    }

    default:
      throw new Error(`Unsupported insight type: ${type}`);
  }
};
