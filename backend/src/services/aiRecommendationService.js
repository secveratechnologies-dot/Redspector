import prisma from '../config/db.js';

/**
 * Generates structured, actionable remediation guidance and impact statements.
 * Supports either database finding lookup or custom body parameters.
 * 
 * @param {Object} params
 * @param {string} [params.findingId] - ID of finding in database
 * @param {Object} [params.finding] - Custom dry-run finding object
 * @param {string} params.tenantId - Isolated tenant ID
 * @returns {Promise<Object>} Recommendation insights (Issue, Impact, Recommendation, Priority)
 */
export const generateRecommendationDetails = async ({ findingId, finding, tenantId }) => {
  let activeFinding = finding;

  if (findingId) {
    activeFinding = await prisma.finding.findFirst({
      where: { id: findingId, tenantId }
    });
    if (!activeFinding) {
      throw new Error('Finding not found');
    }
  }

  if (!activeFinding) {
    throw new Error('Either findingId or finding object must be provided');
  }

  const { title, severity, asset, description } = activeFinding;
  const lowerTitle = title ? title.toLowerCase() : '';
  
  let issue = `An open security finding of severity '${severity}' was identified on target asset '${asset}'.`;
  let impact = `Exploitation of this vulnerability allows unauthorized access or potential compromise of the target resource.`;
  let recommendation = `Verify firewall logs, inspect configuration rules, and implement vendor-recommended software patches.`;

  if (lowerTitle.includes('auth') || lowerTitle.includes('jwt') || lowerTitle.includes('token') || lowerTitle.includes('api')) {
    issue = `Insecure authentication or token validation boundary identified on API endpoint '${asset}'.`;
    impact = `Attackers can spoof authentication tokens, forge signatures, or access administrative scopes without proper credentials, leading to data exposure or account takeover.`;
    recommendation = `1. Implement strict JWT signature checking using a strong key.\n2. Verify signature algorithms (avoid 'none').\n3. Validate scope claims and expiration window metrics for every incoming request.`;
  } else if (lowerTitle.includes('port') || lowerTitle.includes('scan') || lowerTitle.includes('unencrypted') || lowerTitle.includes('ssh')) {
    issue = `Unrestricted network access or open administration ports detected on host '${asset}'.`;
    impact = `Exposing ports such as SSH, database listeners, or administrative consoles allows brute-force attacks, scanner profiling, or direct system exploitation.`;
    recommendation = `1. Apply firewall rules to whitelist only trusted source IP ranges.\n2. Disable unneeded ports (e.g. Postgres 5432, Redis 6379, SSH 22) to external traffic.\n3. Enforce key-based SSH authentication and change default port bindings.`;
  } else if (lowerTitle.includes('header') || lowerTitle.includes('csp') || lowerTitle.includes('hsts') || lowerTitle.includes('cors')) {
    issue = `Missing or misconfigured security response headers on Web application '${asset}'.`;
    impact = `Absence of headers such as Content-Security-Policy (CSP), HSTS, and X-Frame-Options permits clickjacking, cross-site scripting (XSS), and unencrypted protocol downgrade attacks.`;
    recommendation = `1. Enforce HTTP Strict Transport Security (HSTS) with standard max-age.\n2. Configure X-Frame-Options to SAMEORIGIN or DENY to block clickjacking.\n3. Establish a restrictive Content-Security-Policy matching required source scripts.`;
  } else if (description) {
    issue = `Vulnerability identified matching description: ${description}`;
  }

  const priority = ['Critical', 'High', 'Medium', 'Low'].includes(severity) ? severity : 'Medium';

  return {
    issue,
    impact,
    recommendation,
    priority
  };
};
