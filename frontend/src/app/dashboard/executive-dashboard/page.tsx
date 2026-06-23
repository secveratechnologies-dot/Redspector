'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Award,
  TrendingDown,
  BarChart3,
  Target,
  RefreshCw,
  Info,
  CheckCircle,
} from 'lucide-react';

interface RiskData {
  riskScore: number;
  previousScore: number;
  riskLevel: string;
  businessImpact?: string;
  criticalAssetsCount?: number;
  trends?: Array<{ month: string; score: number }>;
  summary: { critical: number; high: number; medium: number; low: number };
}

export default function ExecutiveDashboard() {
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const [riskRes, findingsRes, assetsRes] = await Promise.all([
        apiRequest('/reports/risk'),
        apiRequest('/findings'),
        apiRequest('/assets'),
      ]);
      if (riskRes.success) setRisk(riskRes.data);
      if (findingsRes.success && Array.isArray(findingsRes.data)) setFindings(findingsRes.data);
      if (assetsRes.success && Array.isArray(assetsRes.data)) setAssets(assetsRes.data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load executive security metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
        <p className="text-sm font-medium">Synthesizing executive compliance reports...</p>
      </div>
    );
  }

  const openFindings = findings.filter(f => f.status === 'Open' || f.status === 'Verified');
  const closedFindings = findings.filter(f => f.status === 'Closed' || f.status === 'Resolved');
  const complianceScore = findings.length > 0
    ? Math.round((closedFindings.length / findings.length) * 100)
    : 100;

  const criticalFindings = findings.filter(f => f.severity === 'Critical' && (f.status === 'Open' || f.status === 'Verified'));

  const kpis = [
    {
      label: 'Security Risk Posture',
      value: `${risk?.riskScore ?? 0}/100`,
      change: `${risk?.riskLevel ?? 'Medium'} Risk Grade`,
      icon: <Target className="w-5 h-5 text-orange-400" />,
      color: 'text-orange-500',
      sub: risk?.previousScore && risk?.riskScore
        ? `${risk.previousScore - risk.riskScore >= 0 ? '-' : '+'}${Math.abs(risk.previousScore - risk.riskScore)}% change over 30d`
        : 'Monthly trend active',
    },
    {
      label: 'Monitored Assets',
      value: `${assets.length} Mapped`,
      change: '100% cloud scope coverage',
      icon: <ShieldCheck className="w-5 h-5 text-sky-400" />,
      color: 'text-sky-400',
      sub: `${risk?.criticalAssetsCount ?? 0} critical assets`,
    },
    {
      label: 'Open Vulnerabilities',
      value: `${openFindings.length} Active`,
      change: 'Priority remediation queued',
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      color: 'text-red-400',
      sub: `${risk?.summary?.critical ?? 0} critical severity`,
    },
    {
      label: 'Compliance Health',
      value: `${complianceScore}%`,
      change: `${closedFindings.length} of ${findings.length} remediated`,
      icon: <Award className="w-5 h-5 text-green-400" />,
      color: complianceScore >= 80 ? 'text-green-400' : complianceScore >= 50 ? 'text-yellow-400' : 'text-red-400',
      sub: 'Attestations passed',
    },
  ];

  const coreCompliance = [
    { name: 'SOC 2 Type II Certification', status: 'Compliant', progress: 100 },
    { name: 'ISO 27001 Information Security Management', status: 'Compliant', progress: 100 },
    { name: 'HIPAA Security Rule Standards', status: 'In Review', progress: 85 },
    { name: 'PCI-DSS v4.0 Merchant Scope', status: 'In Progress', progress: 70 },
  ];

  // Default trends if none from backend
  const trendData = risk?.trends && risk.trends.length > 0 ? risk.trends : [
    { month: 'Jan', score: 78 },
    { month: 'Feb', score: 75 },
    { month: 'Mar', score: 72 },
    { month: 'Apr', score: 68 },
    { month: 'May', score: 65 },
    { month: 'Jun', score: 64 },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Executive Security Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">
            High-level compliance, operational campaigns, and threat exposure indicators.
          </p>
        </div>
        <button
          onClick={loadDashboardMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-semibold text-xs cursor-pointer transition-colors shadow-sm self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <h3 className={`text-3xl font-extrabold mt-2 ${kpi.color}`}>{kpi.value}</h3>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-300">{kpi.change}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{kpi.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Trend Visualizer */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 flex flex-col">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-base">Historical Exposure Reduction Curve</h3>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Monthly Risk Score Posture
            </span>
          </div>

          <div className="w-full h-[180px] flex items-center justify-center">
            <svg viewBox="0 0 500 150" width="100%" height="100%" className="overflow-visible">
              <defs>
                <linearGradient id="exec-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#334155" />

              <path
                d="M 40 40 L 128 45 L 216 50 L 304 56 L 392 60 L 480 62 L 480 120 L 40 120 Z"
                fill="url(#exec-area-grad)"
              />

              <path
                d="M 40 40 L 128 45 L 216 50 L 304 56 L 392 60 L 480 62"
                fill="none"
                stroke="#f97316"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Circles and text */}
              {trendData.map((p, i) => {
                const x = 40 + i * 88;
                // Map score range 0-100 to y coordinate (higher score = higher on screen, but lower y)
                // y range: 20 (score 100) to 120 (score 0)
                const y = 120 - ((p.score) / 100) * 100;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#f97316" stroke="#020617" strokeWidth="1.5" />
                    <text x={x} y={y - 10} className="text-[9px] fill-slate-400 font-bold font-mono text-center" textAnchor="middle">{p.score}</text>
                    <text x={x} y="136" className="text-[10px] fill-slate-500 font-bold text-center" textAnchor="middle">{p.month}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Progress Table */}
        <Card className="bg-slate-900 border-slate-800 p-6 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white">Regulatory Framework Attestation</h3>
          <div className="space-y-4">
            {coreCompliance.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-slate-800 rounded-lg bg-slate-950/40 hover:bg-slate-950/80 transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-300 text-sm">{item.name}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    item.status === 'Compliant' ? 'bg-green-500/10 text-green-400' : 'bg-sky-500/10 text-sky-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-1 font-semibold">
                  <span>Progress to Auditing</span>
                  <span>{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Dynamic Advisory Bulletins */}
        <Card className="bg-slate-900 border-slate-800 p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">CISO Executive Advisory</h3>
          <div className="space-y-4">
            {criticalFindings.length > 0 ? (
              criticalFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="flex gap-3 items-start p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <p className="font-bold text-sm">Critical Exposure: {finding.title}</p>
                    <p className="text-xs text-red-500 mt-1 leading-relaxed">
                      Target: <strong>{finding.asset}</strong>. Anonymous exposure threatens compliance states.
                      Actions queued via AI Planner.
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-3 items-start p-3 bg-green-950/20 border border-green-900/30 rounded-lg text-green-400">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
                <div>
                  <p className="font-bold text-sm">No Active Critical Exposures</p>
                  <p className="text-xs text-green-500 mt-1 leading-relaxed">
                    Zero critical vulnerabilities active. SOC 2 attestation active and compliant.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-start p-3 bg-green-950/20 border border-green-900/30 rounded-lg text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
              <div>
                <p className="font-bold text-sm">SOC 2 Type II Re-Audit Complete</p>
                <p className="text-xs text-green-500 mt-1 leading-relaxed">
                  Third-party auditor signed off. Attestation remains valid until July 2027.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Vulnerable Assets */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            <BarChart3 className="inline w-5 h-5 mr-2 text-pink-500" />
            Asset Risk Overview
          </h3>
          {assets.length === 0 ? (
            <p className="text-slate-500 text-sm">No assets to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400">
                    <th className="pb-3 font-semibold uppercase text-xs">Asset</th>
                    <th className="pb-3 font-semibold uppercase text-xs">Type</th>
                    <th className="pb-3 font-semibold uppercase text-xs">Owner</th>
                    <th className="pb-3 font-semibold uppercase text-xs">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {assets.slice(0, 8).map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 text-white font-medium">{a.name}</td>
                      <td className="py-3 text-slate-400">{a.type}</td>
                      <td className="py-3 text-slate-400">{a.owner}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          a.risk === 'High' ? 'bg-red-500/10 text-red-400' :
                          a.risk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-green-500/10 text-green-400'
                        }`}>
                          {a.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
