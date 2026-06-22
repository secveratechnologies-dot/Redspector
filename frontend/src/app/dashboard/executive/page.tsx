'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShieldCheck, AlertTriangle, Award, TrendingUp, BarChart3, Target } from 'lucide-react';

interface RiskData {
  riskScore: number;
  riskLevel: string;
  avgCvss: number;
  criticalAssetsCount: number;
  summary: { critical: number; high: number; medium: number; low: number };
}

export default function ExecutiveDashboard() {
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [findings, setFindings] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
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
        setError(e.message ?? 'Failed to load executive data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading executive view…</span>
      </div>
    );
  }

  const openFindings = findings.filter(f => f.status === 'Open' || f.status === 'Verified');
  const closedFindings = findings.filter(f => f.status === 'Closed' || f.status === 'Resolved');
  const complianceScore = findings.length > 0
    ? Math.round((closedFindings.length / findings.length) * 100)
    : 100;

  const kpis = [
    {
      label: 'Business Risk Level',
      value: risk?.riskLevel ?? '—',
      sub: `Score: ${risk?.riskScore ?? 0}/100`,
      icon: <Target className="w-6 h-6 text-red-400" />,
      color: risk?.riskLevel === 'High' ? 'text-red-400' : risk?.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400',
    },
    {
      label: 'Monitored Assets',
      value: assets.length,
      sub: `${risk?.criticalAssetsCount ?? 0} critical`,
      icon: <ShieldCheck className="w-6 h-6 text-sky-400" />,
      color: 'text-white',
    },
    {
      label: 'Open Vulnerabilities',
      value: openFindings.length,
      sub: `${risk?.summary?.critical ?? 0} critical severity`,
      icon: <AlertTriangle className="w-6 h-6 text-orange-400" />,
      color: 'text-white',
    },
    {
      label: 'Compliance Health',
      value: `${complianceScore}%`,
      sub: `${closedFindings.length} of ${findings.length} remediated`,
      icon: <Award className="w-6 h-6 text-green-400" />,
      color: complianceScore >= 80 ? 'text-green-400' : complianceScore >= 50 ? 'text-yellow-400' : 'text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Executive Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Business risk posture and KPI overview</p>
        </div>
        <span className="text-xs text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-semibold uppercase">{kpi.label}</span>
                <div className="p-2 bg-slate-950 rounded-lg">{kpi.icon}</div>
              </div>
              <p className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance bar */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Compliance Health</h3>
            <span className={`text-sm font-bold ${complianceScore >= 80 ? 'text-green-400' : complianceScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {complianceScore}%
            </span>
          </div>
          <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${complianceScore >= 80 ? 'bg-green-500' : complianceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${complianceScore}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">{closedFindings.length} issues resolved out of {findings.length} total</p>
        </CardContent>
      </Card>

      {/* Severity Summary */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            <BarChart3 className="inline w-5 h-5 mr-2 text-sky-400" />
            Vulnerability Summary by Severity
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Critical', count: risk?.summary?.critical ?? 0, bg: 'bg-red-500/10', text: 'text-red-400' },
              { label: 'High',     count: risk?.summary?.high ?? 0,     bg: 'bg-orange-500/10', text: 'text-orange-400' },
              { label: 'Medium',   count: risk?.summary?.medium ?? 0,   bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
              { label: 'Low',      count: risk?.summary?.low ?? 0,      bg: 'bg-blue-500/10', text: 'text-blue-400' },
            ].map(({ label, count, bg, text }) => (
              <div key={label} className={`rounded-xl p-4 text-center ${bg}`}>
                <p className={`text-3xl font-bold ${text}`}>{count}</p>
                <p className={`text-xs font-semibold uppercase mt-1 ${text}`}>{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Vulnerable Assets */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            <TrendingUp className="inline w-5 h-5 mr-2 text-pink-400" />
            Asset Risk Overview
          </h3>
          {assets.length === 0 ? (
            <p className="text-slate-500 text-sm">No assets to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-800">
                    <th className="pb-2 text-slate-500 font-semibold uppercase text-xs">Asset</th>
                    <th className="pb-2 text-slate-500 font-semibold uppercase text-xs">Type</th>
                    <th className="pb-2 text-slate-500 font-semibold uppercase text-xs">Owner</th>
                    <th className="pb-2 text-slate-500 font-semibold uppercase text-xs">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.slice(0, 8).map((a: any) => (
                    <tr key={a.id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 text-white">{a.name}</td>
                      <td className="py-2 text-slate-400">{a.type}</td>
                      <td className="py-2 text-slate-400">{a.owner}</td>
                      <td className="py-2">
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
