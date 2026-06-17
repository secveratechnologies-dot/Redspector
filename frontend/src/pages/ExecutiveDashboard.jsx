import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingDown,
  Award,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Info,
  Server,
  Play,
  ShieldAlert,
} from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function ExecutiveDashboard({ onNotify }) {
  const { loading, fetchRiskSummary, fetchAssets, fetchCampaigns, fetchFindings } = useAPI();
  const [dashboardData, setDashboardData] = useState({
    riskScore: 0,
    previousScore: 0,
    riskLevel: 'Medium',
    trends: [],
    assetsCount: 0,
    campaignSuccessRate: '0%',
    campaignCompletedCount: 0,
    campaignFailedCount: 0,
    criticalFindings: [],
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    setDataLoading(true);
    try {
      const [riskRes, assetsRes, campaignsRes, findingsRes] = await Promise.all([
        fetchRiskSummary(),
        fetchAssets(),
        fetchCampaigns(),
        fetchFindings(),
      ]);

      let riskScore = 92; // fallback
      let previousScore = 95;
      let riskLevel = 'Low';
      let trends = [];
      let assetsCount = 0;
      let campaignSuccessRate = '100%';
      let campaignCompletedCount = 0;
      let campaignFailedCount = 0;
      let criticalFindings = [];

      if (riskRes.success) {
        riskScore = riskRes.data.riskScore;
        previousScore = riskRes.data.previousScore;
        riskLevel = riskRes.data.riskLevel;
        trends = riskRes.data.trends;
      }

      if (assetsRes.success) {
        assetsCount = assetsRes.data.length;
      }

      if (campaignsRes.success) {
        const finished = campaignsRes.data.filter(
          (c) => c.status === 'Completed' || c.status === 'Failed'
        );
        const completed = finished.filter((c) => c.status === 'Completed').length;
        const failed = finished.filter((c) => c.status === 'Failed').length;
        campaignCompletedCount = completed;
        campaignFailedCount = failed;
        if (finished.length > 0) {
          campaignSuccessRate = `${Math.round((completed / finished.length) * 1000) / 10}%`;
        }
      }

      if (findingsRes.success) {
        criticalFindings = findingsRes.data.filter((f) => f.severity === 'Critical');
      }

      setDashboardData({
        riskScore,
        previousScore,
        riskLevel,
        trends,
        assetsCount,
        campaignSuccessRate,
        campaignCompletedCount,
        campaignFailedCount,
        criticalFindings,
      });
    } catch (error) {
      if (onNotify) {
        onNotify('Error loading executive security metrics');
      }
    } finally {
      setDataLoading(false);
    }
  };

  const coreCompliance = [
    { name: 'SOC 2 Type II Certification', status: 'Compliant', progress: 100 },
    { name: 'ISO 27001 Information Security Management', status: 'Compliant', progress: 100 },
    { name: 'HIPAA Security Rule Standards', status: 'In Review', progress: 85 },
    { name: 'PCI-DSS v4.0 Merchant Scope', status: 'In Progress', progress: 70 },
  ];

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-medium">Synthesizing executive compliance reports...</p>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Security Risk Posture',
      value: `${dashboardData.riskScore}/100`,
      change: `${dashboardData.riskLevel} Risk Grade`,
      icon: Shield,
      color: 'text-orange-600',
      sub: `-${dashboardData.previousScore - dashboardData.riskScore}% decrease over 30d`,
    },
    {
      label: 'Monitored Assets',
      value: `${dashboardData.assetsCount} Mapped`,
      change: '100% cloud scope coverage',
      icon: Server,
      color: 'text-blue-600',
      sub: 'All production subnets active',
    },
    {
      label: 'Campaign Success Rate',
      value: dashboardData.campaignSuccessRate,
      change: `${dashboardData.campaignCompletedCount} Passed / ${dashboardData.campaignFailedCount} Failed`,
      icon: Play,
      color: 'text-green-600',
      sub: 'Autonomous verification runs',
    },
    {
      label: 'Active Critical Risks',
      value: `${dashboardData.criticalFindings.length} Active`,
      change: 'Priority remediation queued',
      icon: ShieldAlert,
      color: 'text-red-600',
      sub: 'Exposing storage & API layers',
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Executive Security Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium">
            High-level compliance, operational campaigns, and threat exposure indicators.
          </p>
        </div>
        <button
          onClick={loadDashboardMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs cursor-pointer transition-colors shadow-sm self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm hover:border-orange-300 transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <h3 className={`text-3xl font-extrabold mt-2 ${kpi.color}`}>{kpi.value}</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-50">
                <p className="text-xs font-bold text-slate-700">{kpi.change}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Trend Visualizer */}
      <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm flex flex-col">
        <div className="border-b border-orange-50 pb-3 flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-base">Historical Exposure Reduction Curve</h3>
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Monthly Risk Score Posture
          </span>
        </div>

        {/* SVG Curve */}
        <div className="w-full h-[180px] flex items-center justify-center">
          <svg viewBox="0 0 500 150" width="100%" height="100%" className="overflow-visible">
            <defs>
              <linearGradient id="exec-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line x1="40" y1="20" x2="480" y2="20" stroke="#f8fafc" strokeDasharray="3 3" />
            <line x1="40" y1="70" x2="480" y2="70" stroke="#f8fafc" strokeDasharray="3 3" />
            <line x1="40" y1="120" x2="480" y2="120" stroke="#e2e8f0" />

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
            {[
              { x: 40, y: 40, score: 78, m: 'Jan' },
              { x: 128, y: 45, score: 75, m: 'Feb' },
              { x: 216, y: 50, score: 72, m: 'Mar' },
              { x: 304, y: 56, score: 68, m: 'Apr' },
              { x: 392, y: 60, score: 65, m: 'May' },
              { x: 480, y: 62, score: 64, m: 'Jun' },
            ].map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
                <text x={p.x} y={p.y - 10} className="text-[9px] fill-slate-500 font-bold font-mono text-center" textAnchor="middle">{p.score}</text>
                <text x={p.x} y="136" className="text-[10px] fill-slate-400 font-bold text-center" textAnchor="middle">{p.m}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Progress Table */}
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6 lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Regulatory Framework Attestation</h3>
          <div className="space-y-4">
            {coreCompliance.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-orange-50 rounded-lg bg-orange-50/10 hover:bg-orange-50/20 transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                  <Badge color={item.status === 'Compliant' ? 'green' : 'blue'}>
                    {item.status}
                  </Badge>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
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
        </div>

        {/* Dynamic Advisory Bulletins */}
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">CISO Executive Advisory</h3>
          <div className="space-y-4">
            {dashboardData.criticalFindings.length > 0 ? (
              dashboardData.criticalFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="flex gap-3 items-start p-3 bg-red-50 border border-red-100 rounded-lg text-red-800"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-bold text-sm">Critical Exposure: {finding.title}</p>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      Target: <strong>{finding.asset}</strong>. Anonymous exposure threatens compliance states.
                      Actions queued via AI Planner.
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-3 items-start p-3 bg-green-50 border border-green-100 rounded-lg text-green-800">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                <div>
                  <p className="font-bold text-sm">No Active Critical Exposures</p>
                  <p className="text-xs text-green-700 mt-1 leading-relaxed">
                    Zero critical vulnerabilities active. SOC 2 attestation active and compliant.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 items-start p-3 bg-green-50 border border-green-100 rounded-lg text-green-800">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
              <div>
                <p className="font-bold text-sm">SOC 2 Type II Re-Audit Complete</p>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  Third-party auditor signed off. Attestation remains valid until July 2027.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
