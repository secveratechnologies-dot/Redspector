import { useState } from 'react';

// Mock API data
const mockUsersData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'Active',
    joinDate: '2024-01-15',
    lastActive: '2 hours ago',
    permissions: ['read', 'write', 'delete', 'manage_users']
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Security Manager',
    status: 'Active',
    joinDate: '2024-02-20',
    lastActive: '30 minutes ago',
    permissions: ['read', 'write', 'manage_policies']
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'Analyst',
    status: 'Active',
    joinDate: '2024-03-10',
    lastActive: '1 day ago',
    permissions: ['read', 'write']
  },
  {
    id: 4,
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'Analyst',
    status: 'Inactive',
    joinDate: '2024-04-05',
    lastActive: '2 weeks ago',
    permissions: ['read']
  },
  {
    id: 5,
    name: 'Tom Brown',
    email: 'tom@example.com',
    role: 'Viewer',
    status: 'Active',
    joinDate: '2024-05-12',
    lastActive: '3 hours ago',
    permissions: ['read']
  },
];

const mockRolesData = [
  {
    id: 1,
    name: 'Admin',
    description: 'Full system access and user management',
    permissions: ['read', 'write', 'delete', 'manage_users', 'manage_roles', 'manage_policies'],
    userCount: 1,
    createdDate: '2024-01-01'
  },
  {
    id: 2,
    name: 'Security Manager',
    description: 'Can manage security policies and view all data',
    permissions: ['read', 'write', 'manage_policies', 'view_audit_logs'],
    userCount: 1,
    createdDate: '2024-01-15'
  },
  {
    id: 3,
    name: 'Analyst',
    description: 'Can read and write reports',
    permissions: ['read', 'write'],
    userCount: 2,
    createdDate: '2024-02-01'
  },
  {
    id: 4,
    name: 'Viewer',
    description: 'Read-only access to dashboards and reports',
    permissions: ['read'],
    userCount: 1,
    createdDate: '2024-02-15'
  },
];

const mockPermissionsData = [
  {
    id: 1,
    name: 'read',
    description: 'View dashboards, reports, and data',
    category: 'General',
    rolesCount: 4,
    active: true
  },
  {
    id: 2,
    name: 'write',
    description: 'Create and modify reports and data',
    category: 'General',
    rolesCount: 3,
    active: true
  },
  {
    id: 3,
    name: 'delete',
    description: 'Delete reports and data',
    category: 'General',
    rolesCount: 1,
    active: true
  },
  {
    id: 4,
    name: 'manage_users',
    description: 'Add, edit, and remove users',
    category: 'Admin',
    rolesCount: 1,
    active: true
  },
  {
    id: 5,
    name: 'manage_roles',
    description: 'Create and modify roles',
    category: 'Admin',
    rolesCount: 1,
    active: true
  },
  {
    id: 6,
    name: 'manage_policies',
    description: 'Manage security policies',
    category: 'Security',
    rolesCount: 2,
    active: true
  },
  {
    id: 7,
    name: 'view_audit_logs',
    description: 'View system audit logs',
    category: 'Security',
    rolesCount: 2,
    active: true
  },
];

const mockAssetsData = [
  {
    id: 'A-001',
    name: 'S3-PROD-01',
    type: 'S3 Bucket',
    owner: 'Platform Team',
    risk: 'High',
    environment: 'Production',
    critical: true,
    ipAddress: 'N/A',
    domainName: 's3.prod.redspecter.io',
    apiEndpoint: 'N/A',
    tags: ['PCI-DSS', 'AWS', 'CustomerData'],
    riskInfo: {
      score: 88,
      vulnerabilities: { critical: 1, high: 2, medium: 4 },
      complianceState: 'Non-compliant',
    },
    exposureData: {
      visibility: 'Publicly Accessible',
      ports: '443 (read/write enabled)',
      sslCert: 'Valid (Expires 2026-09-12)',
    },
    threatInfo: {
      reconProbes: '142 in last 24h',
      status: 'Active threat vectors detected',
    }
  },
  {
    id: 'A-002',
    name: 'IAM-USR-99',
    type: 'Identity',
    owner: 'DevOps',
    risk: 'Medium',
    environment: 'Production',
    critical: true,
    ipAddress: 'N/A',
    domainName: 'iam.redspecter.io',
    apiEndpoint: 'N/A',
    tags: ['RootAccess', 'OAuth'],
    riskInfo: {
      score: 54,
      vulnerabilities: { critical: 0, high: 1, medium: 2 },
      complianceState: 'In Review',
    },
    exposureData: {
      visibility: 'Console access only',
      ports: 'N/A',
      sslCert: 'N/A',
    },
    threatInfo: {
      reconProbes: '0',
      status: 'No active threat vectors',
    }
  },
  {
    id: 'A-003',
    name: 'K8S-CLUSTER-EU',
    type: 'Cluster',
    owner: 'Cloud Eng',
    risk: 'Low',
    environment: 'Production',
    critical: false,
    ipAddress: '10.124.99.12',
    domainName: 'k8s-eu.redspecter.internal',
    apiEndpoint: 'N/A',
    tags: ['InternalOnly', 'Kubernetes'],
    riskInfo: {
      score: 18,
      vulnerabilities: { critical: 0, high: 0, medium: 1 },
      complianceState: 'Compliant',
    },
    exposureData: {
      visibility: 'Internal VPN Restricted',
      ports: '6443 (Internal)',
      sslCert: 'Internal CA Sign-off',
    },
    threatInfo: {
      reconProbes: '0',
      status: 'No active threat vectors',
    }
  },
  {
    id: 'A-004',
    name: 'api.redspecter.io/v1/checkout',
    type: 'API',
    owner: 'Billing Team',
    risk: 'High',
    environment: 'Production',
    critical: true,
    ipAddress: '34.99.12.15',
    domainName: 'api.redspecter.io',
    apiEndpoint: 'https://api.redspecter.io/v1/checkout',
    tags: ['Stripe', 'Billing', 'PciScope'],
    riskInfo: {
      score: 78,
      vulnerabilities: { critical: 0, high: 3, medium: 1 },
      complianceState: 'Non-compliant',
    },
    exposureData: {
      visibility: 'Public API Endpoint',
      ports: '80, 443 (HTTP/HTTPS)',
      sslCert: 'Valid (Expires 2027-01-15)',
    },
    threatInfo: {
      reconProbes: '3,842 in last 24h',
      status: 'DDoS/Brute Force attempts logged',
    }
  },
  {
    id: 'A-005',
    name: 'redspecter.io',
    type: 'Domain',
    owner: 'Marketing',
    risk: 'Low',
    environment: 'Production',
    critical: false,
    ipAddress: '154.212.100.8',
    domainName: 'redspecter.io',
    apiEndpoint: 'N/A',
    tags: ['PublicWebsite', 'SEO'],
    riskInfo: {
      score: 12,
      vulnerabilities: { critical: 0, high: 0, medium: 0 },
      complianceState: 'Compliant',
    },
    exposureData: {
      visibility: 'Public Website',
      ports: '80, 443',
      sslCert: 'Valid (Expires 2026-12-01)',
    },
    threatInfo: {
      reconProbes: '12 in last 24h',
      status: 'No active alerts',
    }
  },
  {
    id: 'A-006',
    name: 'App Gateway IP',
    type: 'IP Address',
    owner: 'Network Security',
    risk: 'Medium',
    environment: 'Staging',
    critical: false,
    ipAddress: '52.188.4.99',
    domainName: 'gateway.staging.redspecter.io',
    apiEndpoint: 'N/A',
    tags: ['NetworkEdge', 'LoadBalancer'],
    riskInfo: {
      score: 42,
      vulnerabilities: { critical: 0, high: 0, medium: 3 },
      complianceState: 'Compliant',
    },
    exposureData: {
      visibility: 'Publicly Reachable Edge',
      ports: '443 (TCP)',
      sslCert: 'Valid (Expires 2026-11-20)',
    },
    threatInfo: {
      reconProbes: '254 in last 24h',
      status: 'Normal scanning background noise',
    }
  }
];

const mockCampaignsData = [
  {
    id: 'C-2026-001',
    name: 'AWS Production Perimeter Scan',
    status: 'Running',
    progress: 45,
    currentStage: 'Vulnerability Mapping',
    findingsCount: 12,
    createdDate: '2026-06-12',
    logs: [
      '[18:00:00] Initializing autonomous campaign perimeter scan on AWS Production subnets...',
      '[18:02:15] Discovery complete: identified 14 active public IP addresses.',
      '[18:05:40] Phase 1: Port-scanning active hosts (80, 443, 8080 open).',
      '[18:10:00] Phase 2: Starting vulnerability mapping scan against endpoints...',
      '[18:12:30] Alert: Exposed AWS S3 Bucket with public write access discovered (F-882).'
    ]
  },
  {
    id: 'C-2026-002',
    name: 'Identity Provider RBAC Audit',
    status: 'Completed',
    progress: 100,
    currentStage: 'Reporting',
    findingsCount: 3,
    createdDate: '2026-06-10',
    logs: [
      '[10:00:00] Initializing IAM identity access configuration review...',
      '[10:02:00] Querying Okta client credentials logs and directory configurations.',
      '[10:15:00] Completed policy mapping audit for 152 corporate user entries.',
      '[10:30:00] Discovered stale credentials on user account Sarah Williams (Inactive).',
      '[10:45:00] Audit finished. Final PDF verification reports compiled.'
    ]
  },
  {
    id: 'C-2026-003',
    name: 'Kubernetes Cluster Hardening',
    status: 'Pending',
    progress: 0,
    currentStage: 'Ready to Run',
    findingsCount: 0,
    createdDate: '2026-06-12',
    logs: [
      'Campaign is initialized. Waiting for trigger...'
    ]
  },
  {
    id: 'C-2026-004',
    name: 'External Web App Pen Test',
    status: 'Failed',
    progress: 30,
    currentStage: 'Failed at Exploitation Stage',
    findingsCount: 1,
    createdDate: '2026-06-08',
    logs: [
      '[09:00:00] Starting web application penetrations suite...',
      '[09:05:00] Map completed: 15 entry points configured.',
      '[09:12:00] Attempting SQL injection on user login form input parameter...',
      '[09:15:00] Error: Web Application Firewall (WAF) rate-limiting triggered. Host IP blocked.',
      '[09:16:00] Execution stopped. Campaign marked as Failed.'
    ]
  },
  {
    id: 'C-2026-005',
    name: 'Internal Database Encryption Scan',
    status: 'Completed',
    progress: 100,
    currentStage: 'Reporting',
    findingsCount: 0,
    createdDate: '2026-06-05',
    logs: [
      '[14:00:00] DB Scan suite initiated on local subnets.',
      '[14:05:00] Scanning RDS instance configs: RDS-POSTGRES-01, RDS-MYSQL-02.',
      '[14:30:00] Verified KMS encryption key state: active and rotating.',
      '[15:00:00] Database scan completed. No non-compliant fields found.'
    ]
  }
];

const mockFindingsData = [
  {
    id: 'F-882',
    title: 'Exposed S3 Bucket with Public Write Access',
    severity: 'Critical',
    asset: 'S3-PROD-01',
    status: 'Open',
    owner: 'Platform Team',
    description: 'The S3 bucket policy is configured to allow Anonymous/Everyone read and write capabilities. Anyone with the bucket URL can write data, potentially leading to data manipulation, ransomware injection, or data leaks.',
    evidence: '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": "*",\n      "Action": ["s3:PutObject", "s3:GetObject"],\n      "Resource": "arn:aws:s3:::s3-prod-01/*"\n    }\n  ]\n}',
    recommendations: 'Update the bucket policy to enforce Authenticated IAM user privileges only. Turn on Block Public Access configurations on the AWS console.'
  },
  {
    id: 'F-883',
    title: 'Stale IAM Credential Usage',
    severity: 'Medium',
    asset: 'IAM-USR-99',
    status: 'Verified',
    owner: 'DevOps',
    description: 'Active access keys on the target account have not been rotated in the last 180 days. Industry standards require rotating secrets every 90 days to minimize leakage impact.',
    evidence: 'Access Key ID: AKIAIOSFODNN7EXAMPLE\nLast Rotated: 2025-10-01 (240 Days Ago)\nStatus: Active',
    recommendations: 'Disable the stale access key on the IAM console, generate a new one, update the deployment config, and delete the stale credential.'
  },
  {
    id: 'F-884',
    title: 'Outdated Linux Kernel Vulnerability (Dirty Pipe)',
    severity: 'High',
    asset: 'K8S-CLUSTER-EU',
    status: 'Open',
    owner: 'Cloud Eng',
    description: 'The container node host is running a Linux kernel version vulnerable to the Dirty Pipe vulnerability (CVE-2022-0847). This permits local unprivileged users to overwrite arbitrary files inside active pages.',
    evidence: 'Kernel Version: 5.10.0-rc1\nCVE-2022-0847 Exploit Test: Vulnerability Confirmed',
    recommendations: 'Re-image host container nodes to use Linux Kernel version 5.16.11, 5.15.25, 5.10.102 or higher.'
  },
  {
    id: 'F-885',
    title: 'Unauthenticated API Checkout Endpoint',
    severity: 'Critical',
    asset: 'api.redspecter.io/v1/checkout',
    status: 'Open',
    owner: 'Billing Team',
    description: 'The billing checkout endpoint lacks token validation on input parameters. Unauthenticated requests are processed directly by payment microservices, exposing Stripe access details.',
    evidence: 'POST /v1/checkout HTTP/1.1\nHost: api.redspecter.io\nAuthorization: (Missing)\n\nResponse: 200 OK (Stripe billing session initialized)',
    recommendations: 'Apply JWT Bearer authorization filters to the checkout route. Return HTTP 401 Unauthorized for empty header contexts.'
  },
  {
    id: 'F-886',
    title: 'Weak TLS Cipher Suites Supported',
    severity: 'Low',
    asset: 'redspecter.io',
    status: 'Verified',
    owner: 'Marketing',
    description: 'The primary load-balancer is configured to support TLS 1.0 and TLS 1.1 protocol handshakes, which are deprecated and vulnerable to connection decrypt exploits.',
    evidence: 'Supported Protocols: TLSv1.0, TLSv1.1, TLSv1.2\nCipher: TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
    recommendations: 'Modify the load-balancer security policy to enforce TLS v1.2 and TLS v1.3 only, and disable CBC-mode ciphers.'
  },
  {
    id: 'F-887',
    title: 'SSL Certificate Expiration Warning',
    severity: 'Medium',
    asset: 'App Gateway IP',
    status: 'Mitigated',
    owner: 'Network Security',
    description: 'SSL certification on gateway load balancer expires in less than 30 days. Mitigated: auto-renewal cron triggered.',
    evidence: 'Certificate Valid Until: 2026-07-01 (18 Days Remaining)\nAuto-Renewal Request: SUCCESS',
    recommendations: 'No actions needed. Check automatic Cron certificate updates logs weekly.'
  }
];

const mockRiskData = {
  riskScore: 64,
  previousScore: 70,
  riskLevel: 'Medium',
  businessImpact: 'High',
  criticalAssetsCount: 3,
  topExposureArea: 'Cloud Data Security',
  trends: [
    { month: 'Jan', score: 78 },
    { month: 'Feb', score: 75 },
    { month: 'Mar', score: 72 },
    { month: 'Apr', score: 68 },
    { month: 'May', score: 65 },
    { month: 'Jun', score: 64 },
  ],
  distribution: [
    { category: 'Cloud Infrastructure', score: 45, level: 'Medium' },
    { category: 'Identity & Access (IAM)', score: 30, level: 'Low' },
    { category: 'Data Protection (S3/DB)', score: 82, level: 'High' },
    { category: 'Container Orchestration (K8s)', score: 55, level: 'Medium' },
    { category: 'Network Security', score: 40, level: 'Medium' },
  ],
  heatmap: [
    { likelihood: 2, impact: 2, count: 2, label: 'Critical Risk', color: 'bg-red-500/80 text-white' },
    { likelihood: 2, impact: 1, count: 1, label: 'High Risk', color: 'bg-orange-500/80 text-white' },
    { likelihood: 2, impact: 0, count: 0, label: 'Medium Risk', color: 'bg-yellow-500/80 text-slate-800' },
    { likelihood: 1, impact: 2, count: 1, label: 'High Risk', color: 'bg-orange-500/80 text-white' },
    { likelihood: 1, impact: 1, count: 2, label: 'Medium Risk', color: 'bg-yellow-500/80 text-slate-800' },
    { likelihood: 1, impact: 0, count: 1, label: 'Low Risk', color: 'bg-green-500/80 text-white' },
    { likelihood: 0, impact: 2, count: 0, label: 'Medium Risk', color: 'bg-yellow-500/80 text-slate-800' },
    { likelihood: 0, impact: 1, count: 1, label: 'Low Risk', color: 'bg-green-500/80 text-white' },
    { likelihood: 0, impact: 0, count: 2, label: 'Negligible Risk', color: 'bg-emerald-600/80 text-white' },
  ],
  topRisks: [
    {
      id: 'R-01',
      scenario: 'Unauthorized Public Data Access (Ransomware Injection)',
      asset: 'S3-PROD-01',
      likelihood: 'High',
      impact: 'High',
      score: 88,
      owner: 'Platform Team'
    },
    {
      id: 'R-02',
      scenario: 'Checkout Payment Microservice Exposure',
      asset: 'api.redspecter.io/v1/checkout',
      likelihood: 'Medium',
      impact: 'High',
      score: 78,
      owner: 'Billing Team'
    },
    {
      id: 'R-03',
      scenario: 'Local Privilege Escalation via Kernel Overwrite',
      asset: 'K8S-CLUSTER-EU',
      likelihood: 'High',
      impact: 'Medium',
      score: 65,
      owner: 'Cloud Eng'
    },
    {
      id: 'R-04',
      scenario: 'Stale Roots/Admin Credentials Abuse',
      asset: 'IAM-USR-99',
      likelihood: 'Low',
      impact: 'High',
      score: 54,
      owner: 'DevOps'
    },
    {
      id: 'R-05',
      scenario: 'Insecure Cipher Man-in-the-Middle Handshakes',
      asset: 'redspecter.io',
      likelihood: 'Medium',
      impact: 'Low',
      score: 24,
      owner: 'Marketing'
    }
  ]
};

const mockAIRecommendations = [
  {
    id: 'REC-01',
    title: 'Enforce Global MFA Requirements',
    category: 'Identity & Access Control',
    priority: 'Critical',
    impact: 'High',
    description: 'Enforce mandatory MFA controls on all users (especially stale admin profiles) to prevent credentials harvesting and session replay access.',
    target: 'IAM-USR-99',
    automated: false
  },
  {
    id: 'REC-02',
    title: 'Restrict Public S3 Write Access Policy',
    category: 'Cloud Data Protection',
    priority: 'High',
    impact: 'Critical',
    description: 'Modify S3 bucket policy of S3-PROD-01 to remove Principal "*" put privileges, preventing anonymous malware uploads.',
    target: 'S3-PROD-01',
    automated: false
  },
  {
    id: 'REC-03',
    title: 'Kubernetes Container Host Node Kernel Upgrade',
    category: 'Container Orchestration',
    priority: 'High',
    impact: 'Medium',
    description: 'Upgrade the Linux Kernel version on the EU cluster host nodes to patch CVE-2022-0847 (Dirty Pipe) root escape vectors.',
    target: 'K8S-CLUSTER-EU',
    automated: false
  },
  {
    id: 'REC-04',
    title: 'Apply API Gateways Token Validation Filter',
    category: 'Network Edge Protection',
    priority: 'Medium',
    impact: 'High',
    description: 'Configure standard checkout HTTP route checks returning 401 Unauthorized for empty header contexts.',
    target: 'api.redspecter.io/v1/checkout',
    automated: false
  }
];

const mockAIFindingsAnalysis = {
  'F-882': {
    threatSummary: 'An anonymous actor can invoke PutObject actions directly against the bucket endpoint, uploading ransomware or deleting production data.',
    riskAnalysis: 'Exposed S3 buckets represent top risk targets for credentials harvesting or operational disruption. Estimated Business Impact: Critical.',
    suggestedActions: [
      'Toggle Block Public Access to "True" on the AWS S3 Console.',
      'Audit existing bucket files to verify no malicious executable scripts were uploaded.',
      'Enforce IAM Role-Based Access for API request signatures.'
    ]
  },
  'F-883': {
    threatSummary: 'Stale credentials on administrative user accounts allow adversaries to perform credentials stuffing or exploit compromised API access keys.',
    riskAnalysis: 'Failure to rotate access keys every 90 days increases the probability of leaked secrets being successfully abused in scripts.',
    suggestedActions: [
      'Disable active Access Key AKIAIOSFODNN7EXAMPLE immediately.',
      'Generate a rotated credential pair and deploy to active environment configs.',
      'Delete the inactive credentials record from the IAM portal.'
    ]
  },
  'F-884': {
    threatSummary: 'Dirty Pipe (CVE-2022-0847) allows unprivileged container processes to write arbitrary data to read-only page caches in memory, leading to host privilege escape.',
    riskAnalysis: 'A compromise of any application container inside the cluster allows full root host shell execution and host takeover.',
    suggestedActions: [
      'Drain active pods from nodes running Kernel versions lower than 5.15.25.',
      'Update worker nodes OS image templates to modern secure releases.',
      'Enforce Pod Security Standards to restrict container capability flags.'
    ]
  },
  'F-885': {
    threatSummary: 'Unauthenticated payment processing routes expose payment session initialization tokens and customer transaction logs to scraping scripts.',
    riskAnalysis: 'Exploitation can lead to bypass of billing checks or Stripe API rate limits abuse, costing organization funds.',
    suggestedActions: [
      'Mount JWT validation middleware filters in the routing chain.',
      'Verify request tokens in header signatures prior to processing payment session init.',
      'Implement client IP-based rate limiting on the checkout endpoint.'
    ]
  },
  'F-886': {
    threatSummary: 'Adversaries performing passive network eavesdropping can decrypt TLS 1.0 / 1.1 sessions using padding oracle exploits (e.g. BEAST/POODLE).',
    riskAnalysis: 'Risk is evaluated as Low as modern browsers block deprecated TLS versions automatically, but legacy client integration requests remain vulnerable.',
    suggestedActions: [
      'Update load-balancer config rules to disable TLS v1.0 and v1.1 handshakes.',
      'Restrict accepted cipher lists to TLS 1.2/1.3 GCM/CCM suites.',
      'Perform regular SSL labs verification tests.'
    ]
  },
  'F-887': {
    threatSummary: 'Expired gateway SSL certifications trigger browser security warnings, blocking customer traffic and degrading trust.',
    riskAnalysis: 'Auto-renewal systems exist, but failure warnings must trigger alert checks to verify certificate signing success.',
    suggestedActions: [
      'Verify let\'s encrypt auto-renewal log outputs.',
      'Confirm renewal certificates are mapped to gateway load balancers.',
      'No manual intervention needed unless renewal logs alert failures.'
    ]
  }
};

const mockTenantSettings = {
  companyName: 'RedSpecter Security',
  domain: 'redspecter.io',
  contactEmail: 'admin@redspecter.io',
  defaultRole: 'Analyst',
  mfaRequirement: 'Enforced', // 'Enforced' or 'Optional'
  sessionTimeout: '30m', // '15m', '30m', '1h', '4h'
  ipWhitelist: '192.168.1.0/24, 10.0.0.0/8',
  brandingColor: 'orange', // orange, indigo, emerald, blue
};

export const useAPI = () => {
  const [loading, setLoading] = useState(false);

  // Simulate API call with delay
  const simulateAPICall = (data, delay = 500) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, delay);
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockUsersData);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockRolesData);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockPermissionsData);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const createUser = async (userData) => {
    setLoading(true);
    try {
      const newUser = {
        id: Math.max(...mockUsersData.map(u => u.id)) + 1,
        ...userData,
        joinDate: new Date().toISOString().split('T')[0],
        lastActive: 'now'
      };
      mockUsersData.push(newUser);
      const data = await simulateAPICall(newUser);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (userId, userData) => {
    setLoading(true);
    try {
      const index = mockUsersData.findIndex(u => u.id === userId);
      if (index !== -1) {
        mockUsersData[index] = { ...mockUsersData[index], ...userData };
      }
      const data = await simulateAPICall(mockUsersData[index]);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    setLoading(true);
    try {
      const index = mockUsersData.findIndex(u => u.id === userId);
      if (index !== -1) {
        mockUsersData.splice(index, 1);
      }
      await simulateAPICall(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const createRole = async (roleData) => {
    setLoading(true);
    try {
      const newRole = {
        id: Math.max(...mockRolesData.map(r => r.id), 0) + 1,
        ...roleData,
        userCount: 0,
        createdDate: new Date().toISOString().split('T')[0]
      };
      mockRolesData.push(newRole);
      const data = await simulateAPICall(newRole);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const updateRole = async (roleId, roleData) => {
    setLoading(true);
    try {
      const index = mockRolesData.findIndex(r => r.id === roleId);
      if (index !== -1) {
        mockRolesData[index] = { ...mockRolesData[index], ...roleData };
      }
      const data = await simulateAPICall(mockRolesData[index]);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const deleteRole = async (roleId) => {
    setLoading(true);
    try {
      const index = mockRolesData.findIndex(r => r.id === roleId);
      if (index !== -1) {
        mockRolesData.splice(index, 1);
      }
      await simulateAPICall(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const createPermission = async (permissionData) => {
    setLoading(true);
    try {
      const newPermission = {
        id: Math.max(...mockPermissionsData.map(p => p.id), 0) + 1,
        ...permissionData,
        rolesCount: 0
      };
      mockPermissionsData.push(newPermission);
      const data = await simulateAPICall(newPermission);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const updatePermission = async (permissionId, permissionData) => {
    setLoading(true);
    try {
      const index = mockPermissionsData.findIndex(p => p.id === permissionId);
      if (index !== -1) {
        mockPermissionsData[index] = { ...mockPermissionsData[index], ...permissionData };
      }
      const data = await simulateAPICall(mockPermissionsData[index]);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const deletePermission = async (permissionId) => {
    setLoading(true);
    try {
      const index = mockPermissionsData.findIndex(p => p.id === permissionId);
      if (index !== -1) {
        mockPermissionsData.splice(index, 1);
      }
      await simulateAPICall(null);
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const togglePermissionActive = async (permissionId) => {
    setLoading(true);
    try {
      const index = mockPermissionsData.findIndex(p => p.id === permissionId);
      if (index !== -1) {
        mockPermissionsData[index].active = !mockPermissionsData[index].active;
      }
      const data = await simulateAPICall(mockPermissionsData[index]);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchTenantSettings = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockTenantSettings);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const updateTenantSettings = async (settingsData) => {
    setLoading(true);
    try {
      Object.assign(mockTenantSettings, settingsData);
      const data = await simulateAPICall(mockTenantSettings);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockAssetsData);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchAssetById = async (assetId) => {
    setLoading(true);
    try {
      const asset = mockAssetsData.find(a => a.id === assetId);
      const data = await simulateAPICall(asset);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockCampaignsData);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchCampaignById = async (campaignId) => {
    setLoading(true);
    try {
      const campaign = mockCampaignsData.find(c => c.id === campaignId);
      const data = await simulateAPICall(campaign);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const startCampaign = async (campaignId) => {
    setLoading(true);
    try {
      const index = mockCampaignsData.findIndex(c => c.id === campaignId);
      if (index !== -1) {
        mockCampaignsData[index].status = 'Running';
        mockCampaignsData[index].progress = 15;
        mockCampaignsData[index].currentStage = 'Reconnaissance';
        mockCampaignsData[index].logs.push(`[${new Date().toLocaleTimeString()}] Triggered start action manually. Initializing scan rules...`);
      }
      const data = await simulateAPICall(mockCampaignsData[index]);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const updateCampaignProgress = async (campaignId, campaignData) => {
    try {
      const index = mockCampaignsData.findIndex(c => c.id === campaignId);
      if (index !== -1) {
        mockCampaignsData[index] = { ...mockCampaignsData[index], ...campaignData };
      }
      return { success: true, data: mockCampaignsData[index] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockFindingsData);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchFindingById = async (findingId) => {
    setLoading(true);
    try {
      const finding = mockFindingsData.find(f => f.id === findingId);
      const data = await simulateAPICall(finding);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchRiskSummary = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockRiskData);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const fetchAIRecommendations = async () => {
    setLoading(true);
    try {
      const data = await simulateAPICall(mockAIRecommendations);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const executeAIRecommendation = async (recId) => {
    setLoading(true);
    try {
      const index = mockAIRecommendations.findIndex((r) => r.id === recId);
      if (index !== -1) {
        mockAIRecommendations[index].automated = true;
      }
      const data = await simulateAPICall(mockAIRecommendations[index]);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const analyzeFindingWithAI = async (findingId) => {
    setLoading(true);
    try {
      const analysis = mockAIFindingsAnalysis[findingId] || {
        threatSummary: 'No active AI models mapping this finding.',
        riskAnalysis: 'Low risk evaluated. No active threats detected.',
        suggestedActions: ['No actions recommended.']
      };
      const data = await simulateAPICall(analysis, 700);
      setLoading(false);
      return { success: true, data };
    } catch (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const getBackendToken = async () => {
    let token = localStorage.getItem('backend_token');
    if (token) return token;

    const email = 'frontend-rag@redspecter.com';
    const password = 'password123';

    try {
      // First try to login
      let loginRes = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let loginData = await loginRes.json();

      if (loginData.success && loginData.data && loginData.data.accessToken) {
        token = loginData.data.accessToken;
        localStorage.setItem('backend_token', token);
        return token;
      }

      // If login fails, try to register
      let registerRes = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName: 'Frontend RAG User',
          companyName: 'RedSpecter Frontend',
          role: 'Viewer'
        })
      });
      await registerRes.json();

      // Login again
      loginRes = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      loginData = await loginRes.json();

      if (loginData.success && loginData.data && loginData.data.accessToken) {
        token = loginData.data.accessToken;
        localStorage.setItem('backend_token', token);
        return token;
      }
    } catch (e) {
      console.error('[RAG Backend Token Error]', e.message);
    }
    return null;
  };

  const storeRagContext = async (ragData) => {
    setLoading(true);
    try {
      const token = await getBackendToken();
      if (!token) {
        throw new Error('Failed to obtain backend API authorization');
      }

      const res = await fetch('http://localhost:5001/api/rag/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ragData)
      });
      const resData = await res.json();
      setLoading(false);
      return resData;
    } catch (error) {
      setLoading(false);
      console.warn('[RAG Store Fallback] Storing locally', error.message);
      return { success: true, message: 'Context document indexed successfully (simulation fallback)' };
    }
  };

  const searchRagContext = async (query, limit = 5) => {
    setLoading(true);
    try {
      const token = await getBackendToken();
      if (!token) {
        throw new Error('Failed to obtain backend API authorization');
      }

      const res = await fetch('http://localhost:5001/api/rag/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query, limit })
      });
      const resData = await res.json();
      setLoading(false);
      return resData;
    } catch (error) {
      setLoading(false);
      console.warn('[RAG Search Fallback] Running similarity matching in frontend', error.message);
      const mockMatches = [
        { sourceId: 'pol-iam-01', source: 'Policy', content: 'Identity access management policy enforces MFA and session token rotation on all administrative accounts.', score: 0.94 },
        { sourceId: 'ast-rag-db', source: 'Asset', content: 'Asset: customer-postgres-db (Type: IP, Owner: OpsTeam, Risk: High, CVEs: CVE-2021-44228)', score: 0.81 }
      ];
      return { success: true, data: mockMatches };
    }
  };

  return {
    loading,
    fetchUsers,
    fetchRoles,
    fetchPermissions,
    createUser,
    updateUser,
    deleteUser,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    togglePermissionActive,
    fetchTenantSettings,
    updateTenantSettings,
    fetchAssets,
    fetchAssetById,
    fetchCampaigns,
    fetchCampaignById,
    startCampaign,
    updateCampaignProgress,
    fetchFindings,
    fetchFindingById,
    fetchRiskSummary,
    fetchAIRecommendations,
    executeAIRecommendation,
    analyzeFindingWithAI,
    storeRagContext,
    searchRagContext,
  };
};
