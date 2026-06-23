'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Shield, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsDashboard() {
  const trendMetrics = [
    { label: 'Mean Time to Remediate', value: '4.8 Days', change: '-1.2 days', improved: true },
    { label: 'Unmitigated Vulnerabilities', value: '18 Active', change: '+2 new', improved: false },
    { label: 'Daily Scan Coverage', value: '100%', change: 'All zones mapped', improved: true },
  ];

  const categoryRisk = [
    { name: 'Cloud Infrastructure (AWS/GCP)', risk: 'Medium', score: 45, color: 'bg-orange-500', badgeColor: 'bg-orange-500/10 text-orange-400' },
    { name: 'Identity & Access Management (IAM)', risk: 'Low', score: 20, color: 'bg-green-500', badgeColor: 'bg-green-500/10 text-green-400' },
    { name: 'Data Security (S3 Buckets/RDS)', risk: 'High', score: 75, color: 'bg-red-500', badgeColor: 'bg-red-500/10 text-red-400' },
    { name: 'Kubernetes Container Orchestration', risk: 'Medium', score: 55, color: 'bg-orange-500', badgeColor: 'bg-orange-500/10 text-orange-400' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-white">Security Risk & Trend Analytics</h1>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trendMetrics.map((metric, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{metric.label}</p>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-extrabold text-white">{metric.value}</span>
                <span className={`flex items-center text-xs font-bold ${metric.improved ? 'text-green-400' : 'text-red-400'}`}>
                  {metric.improved ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  {metric.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score by Category */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2 space-y-4">
          <CardContent className="p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-5">
              <h3 className="text-lg font-semibold text-white">Risk Severity Exposure</h3>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Calculated on active CVSS vectors
              </span>
            </div>

            <div className="space-y-6 pt-2">
              {categoryRisk.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-300">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.badgeColor}`}>
                        {item.risk}
                      </span>
                      <span className="text-slate-500 font-mono">Score: {item.score}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all duration-700`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Incident Trends card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Critical Threat Index</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pt-2">
              The security threat index measures external recon probes against internal vulnerability scans.
              Over the last 30 days, threat levels have remained <strong className="text-green-400">Stable (Green)</strong> due to proactive firewall policies.
            </p>
            <div className="pt-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Firewall Block Success</span>
                  <span>99.98%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '99.98%' }} />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span>Patch Deployment Velocity</span>
                  <span>85.4%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5">
                  <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '85.4%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
