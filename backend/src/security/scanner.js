import net from 'net';

const detectService = (port) => {
  switch (port) {
    case 22: return 'SSH Daemon';
    case 80: return 'HTTP Web Server';
    case 443: return 'HTTPS Web Server';
    case 3000: return 'Frontend Application';
    case 5001: return 'Redspector Backend API Server';
    case 5432: return 'PostgreSQL Database Server';
    case 6379: return 'Redis Cache Server';
    default: return 'Unknown Service';
  }
};

// Network port scanner using raw sockets
export const scanPorts = (host, ports = [22, 80, 443, 3000, 5001, 5432, 6379]) => {
  return new Promise((resolve) => {
    const openPorts = [];
    let completed = 0;

    if (ports.length === 0) return resolve([]);

    // Normalize host (strip protocol, paths, and port numbers)
    const cleanHost = host.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];

    ports.forEach((port) => {
      const socket = new net.Socket();
      socket.setTimeout(250); // timeout for fast local scanning

      socket.on('connect', () => {
        openPorts.push({
          port,
          service: detectService(port)
        });
        socket.destroy();
      });

      socket.on('timeout', () => {
        socket.destroy();
      });

      socket.on('error', () => {
        socket.destroy();
      });

      socket.on('close', () => {
        completed++;
        if (completed === ports.length) {
          resolve(openPorts);
        }
      });

      socket.connect(port, cleanHost);
    });
  });
};

// Web header analysis and TLS validation
export const scanWebHeaders = async (target) => {
  const findings = [];
  let url = target;

  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const headers = res.headers;

    if (!headers.get('content-security-policy')) {
      findings.push({
        title: 'Missing Content-Security-Policy (CSP) Header',
        severity: 'Medium',
        description: 'The Content-Security-Policy response header is missing, leaving the web application exposed to Cross-Site Scripting (XSS) and data injection vulnerabilities.',
        evidence: `Target URL: ${url}\nResponse Headers: CSP is missing`,
        recommendations: 'Configure your web server or application middleware to return a strict Content-Security-Policy header.'
      });
    }

    if (!headers.get('x-frame-options')) {
      findings.push({
        title: 'Missing X-Frame-Options Header (Clickjacking)',
        severity: 'Low',
        description: 'The X-Frame-Options response header is missing, allowing attackers to load this application within an iframe and perform clickjacking exploits.',
        evidence: `Target URL: ${url}\nResponse Headers: X-Frame-Options is missing`,
        recommendations: 'Set the X-Frame-Options header to SAMEORIGIN or DENY.'
      });
    }

    if (!url.startsWith('https')) {
      findings.push({
        title: 'Insecure Communication Protocol (TLS Missing)',
        severity: 'Medium',
        description: 'The target host communicates over plain HTTP instead of HTTPS. Communication is prone to sniffing and machine-in-the-middle attacks.',
        evidence: `Protocol used: HTTP\nTarget: ${url}`,
        recommendations: 'Enable HTTPS on the web server, purchase/install a valid TLS certificate, and redirect all HTTP traffic to HTTPS.'
      });
    } else if (!headers.get('strict-transport-security')) {
      findings.push({
        title: 'Missing HTTP Strict Transport Security (HSTS) Header',
        severity: 'Low',
        description: 'HTTP Strict Transport Security response header is missing, which could allow user browsers to downgrade back to standard HTTP connections.',
        evidence: `Target URL: ${url}\nResponse Headers: strict-transport-security is missing`,
        recommendations: 'Configure HSTS response header with a suitable max-age parameter.'
      });
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[Scanner Web Error] Failed to scan headers for ${url}:`, err.message);
  }

  return findings;
};

// API Endpoint validation and JWT checks
export const scanApi = async (target) => {
  const findings = [];
  let url = target;

  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  // Probe campaign list route as discovery target
  const probePath = '/api/campaigns';
  const probeUrl = `${url.replace(/\/+$/, '')}${probePath}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000);

  try {
    const res = await fetch(probeUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer malformed_jwt_token_signature_check'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // If API yields 200/201 despite the bad signature, there is authentication failure
    if (res.status === 200 || res.status === 201) {
      findings.push({
        title: 'Broken JWT Authentication / Authorization on API Endpoint',
        severity: 'High',
        description: `Probed API endpoint ${probePath} with a malformed JWT signature and it returned HTTP ${res.status}. Authentication checks are bypassable or not enforced.`,
        evidence: `Request: GET ${probeUrl}\nHeader: Authorization: Bearer malformed_jwt_token_signature_check\nStatus Code: ${res.status}`,
        recommendations: 'Ensure that all sensitive API endpoints validate the JWT signature, and reject requests with HTTP 401/403 if invalid.'
      });
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[Scanner API Error] Failed to probe api endpoint ${probeUrl}:`, err.message);
  }

  return findings;
};
