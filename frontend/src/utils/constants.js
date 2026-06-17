export const INITIAL_CAMPAIGNS = [
  { 
    id: 'C-2026-001', 
    name: 'AWS Production Perimeter Scan', 
    status: 'Running', 
    progress: 45, 
    findings: 12 
  },
  { 
    id: 'C-2026-002', 
    name: 'Identity Provider RBAC Audit', 
    status: 'Completed', 
    progress: 100, 
    findings: 3 
  },
  { 
    id: 'C-2026-003', 
    name: 'Kubernetes Cluster Hardening', 
    status: 'Pending', 
    progress: 0, 
    findings: 0 
  },
];

export const INITIAL_ASSETS = [
  { 
    id: 'A-001', 
    name: 'S3-PROD-01', 
    type: 'S3 Bucket', 
    owner: 'Platform Team', 
    risk: 'High' 
  },
  { 
    id: 'A-002', 
    name: 'IAM-USR-99', 
    type: 'Identity', 
    owner: 'DevOps', 
    risk: 'Medium' 
  },
  { 
    id: 'A-003', 
    name: 'K8S-CLUSTER-EU', 
    type: 'Cluster', 
    owner: 'Cloud Eng', 
    risk: 'Low' 
  },
];

export const INITIAL_FINDINGS = [
  { 
    id: 'F-882', 
    severity: 'High', 
    title: 'Exposed S3 Bucket with Public Write Access', 
    asset: 'S3-PROD-01', 
    status: 'Open' 
  },
  { 
    id: 'F-883', 
    severity: 'Medium', 
    title: 'Stale IAM Credential Usage', 
    asset: 'IAM-USR-99', 
    status: 'Verified' 
  },
];

export const DASHBOARD_STATS = [
  { label: 'Active Campaigns', val: '1', color: 'text-slate-900' },
  { label: 'Verified Findings', val: '12', color: 'text-orange-600' },
  { label: 'Avg. Risk Score', val: '74/100', color: 'text-blue-600' },
  { label: 'System Health', val: '99.9%', color: 'text-green-600' },
];

export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'assets', label: 'Assets' },
  { id: 'findings', label: 'Findings' },
  { id: 'integrations', label: 'Integrations' },
];
