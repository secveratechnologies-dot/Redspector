'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Gauge, AlertTriangle, ShieldCheck, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface RiskData {
  riskScore: number;
  riskLevel: string;
  avgCvss: number;
  avgEpss: number;
  criticalAssetsCount: number;
  summary: { critical: number; high: number; medium: number; low: number };
  distribution: { category: string; score: number; level: string }[];
}

const levelColors: Record<string, string> = {
  High:     'text-red-400',
  Medium:   'text-yellow-400',
  Low:      'text-green-400',
  Critical: 'text-red-500',
};

const levelBg: Record<string, string> = {
  High:     'bg-red-500',
  Medium:   'bg-yellow-500',
  Low:      'bg-green-500',
  Critical: 'bg-red-600',
};

export default function RiskDashboard() {
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('/reports/risk');
        if (res.success) setRisk(res.data);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load risk data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading risk intelligence…</span>
      </div>
    );
  }

  if (!risk || error) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <p className="text-slate-400">{error || 'No risk data available.'}</p>
        </CardContent>
      </Card>
    );
  }

  const scorePercent = Math.min(100, risk.riskScore);
  const scoreColor =
    risk.riskLevel === 'High' ? '#ef4444' :
    risk.riskLevel === 'Medium' ? '#eab308' : '#22c55e';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Risk Intelligence</h2>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Risk Score', value: risk.riskScore, sub: risk.riskLevel, icon: <Gauge className="w-5 h-5 text-purple-400" /> },
          { label: 'Avg CVSS', value: risk.avgCvss, sub: 'vulnerability severity', icon: <BarChart3 className="w-5 h-5 text-sky-400" /> },
          { label: 'Avg EPSS', value: `${(risk.avgEpss * 100).toFixed(1)}%`, sub: 'exploitation probability', icon: <TrendingUp className="w-5 h-5 text-pink-400" /> },
          { label: 'Critical Assets', value: risk.criticalAssetsCount, sub: 'high-priority targets', icon: <AlertTriangle className="w-5 h-5 text-orange-400" /> },
        ].map((stat, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-semibold uppercase">{stat.label}</span>
                {stat.icon}
              </div>
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Score Gauge */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Score Breakdown</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-slate-800 rounded-full h-4 overflow-hidden">
              <div
                className="h-4 rounded-full transition-all duration-700"
                style={{ width: `${scorePercent}%`, backgroundColor: scoreColor }}
              />
            </div>
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>
              {risk.riskScore}
            </span>
            <span className={`text-sm font-semibold ${levelColors[risk.riskLevel] ?? 'text-slate-400'}`}>
              {risk.riskLevel}
            </span>
          </div>

          {/* Finding severity summary */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Critical', count: risk.summary.critical, color: 'bg-red-500/20 text-red-400' },
              { label: 'High',     count: risk.summary.high,     color: 'bg-orange-500/20 text-orange-400' },
              { label: 'Medium',   count: risk.summary.medium,   color: 'bg-yellow-500/20 text-yellow-400' },
              { label: 'Low',      count: risk.summary.low,      color: 'bg-blue-500/20 text-blue-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-semibold uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Heatmap */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            <BarChart3 className="inline w-5 h-5 mr-2 text-sky-400" />
            Risk Distribution Heatmap
          </h3>
          <div className="space-y-4">
            {risk.distribution.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{d.category}</span>
                  <span className={`font-semibold ${levelColors[d.level] ?? 'text-slate-400'}`}>{d.level}</span>
                </div>
                <div className="bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${levelBg[d.level] ?? 'bg-slate-500'}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
