import React from 'react';
import { BarChart3, Shield, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Badge from '../components/Badge';

export default function Analytics() {
  const trendMetrics = [
    { label: 'Mean Time to Remediate', value: '4.8 Days', change: '-1.2 days', improved: true },
    { label: 'Unmitigated Vulnerabilities', value: '18 Active', change: '+2 new', improved: false },
    { label: 'Daily Scan Coverage', value: '100%', change: 'All zones mapped', improved: true },
  ];

  const categoryRisk = [
    { name: 'Cloud Infrastructure (AWS/GCP)', risk: 'Medium', score: 45, color: 'bg-orange-500' },
    { name: 'Identity & Access Management (IAM)', risk: 'Low', score: 20, color: 'bg-green-500' },
    { name: 'Data Security (S3 Buckets/RDS)', risk: 'High', score: 75, color: 'bg-red-500' },
    { name: 'Kubernetes Container Orchestration', risk: 'Medium', score: 55, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-slate-800">Security Risk & Trend Analytics</h1>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trendMetrics.map((metric, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{metric.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-slate-800">{metric.value}</span>
              <span className={`flex items-center text-xs font-bold ${metric.improved ? 'text-green-600' : 'text-red-600'}`}>
                {metric.improved ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score by Category */}
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-orange-50">
            <h3 className="text-lg font-semibold text-slate-800">Risk Severity Exposure</h3>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Calculated on active CVSS vectors
            </span>
          </div>

          <div className="space-y-6 pt-2">
            {categoryRisk.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.risk === 'High' ? 'red' : item.risk === 'Medium' ? 'blue' : 'green'} label={item.risk} />
                    <span className="text-slate-500 font-mono">Score: {item.score}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className={`${item.color} h-3 rounded-full transition-all duration-700`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Incident Trends card */}
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-50 pb-2">
            <Shield className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-slate-800">Critical Threat Index</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            The security threat index measures external recon probes against internal vulnerability scans. 
            Over the last 30 days, threat levels have remained **Stable (Green)** due to proactive firewall policies.
          </p>
          <div className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Firewall Block Success</span>
              <span>99.98%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '99.98%' }} />
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-2">
              <span>Patch Deployment Velocity</span>
              <span>85.4%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '85.4%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
