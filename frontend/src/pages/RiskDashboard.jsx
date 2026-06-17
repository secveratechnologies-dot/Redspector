import React, { useState, useEffect } from 'react';
import {
  Gauge,
  TrendingDown,
  ShieldAlert,
  Globe,
  Building2,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Info,
} from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function RiskDashboard({ onNotify }) {
  const { loading, fetchRiskSummary } = useAPI();
  const [riskData, setRiskData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCell, setActiveCell] = useState(null); // { likelihood, impact } or null

  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    const result = await fetchRiskSummary();
    if (result.success) {
      setRiskData(result.data);
    } else {
      if (onNotify) {
        onNotify('Failed to retrieve organizational risk telemetry');
      }
    }
  };

  if (loading || !riskData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-medium">Retrieving security risk models...</p>
      </div>
    );
  }

  // Handle cell click on heatmap to toggle filter
  const handleCellClick = (likelihood, impact) => {
    if (activeCell && activeCell.likelihood === likelihood && activeCell.impact === impact) {
      setActiveCell(null); // toggle off
    } else {
      setActiveCell({ likelihood, impact });
    }
  };

  // Convert likelihood string to integer index
  const getLikelihoodVal = (str) => {
    if (str === 'High') return 2;
    if (str === 'Medium') return 1;
    return 0; // Low
  };

  // Convert impact string to integer index
  const getImpactVal = (str) => {
    if (str === 'High') return 2;
    if (str === 'Medium') return 1;
    return 0; // Low
  };

  // Filter top risks
  const filteredRisks = riskData.topRisks.filter((risk) => {
    // 1. Text Search Filter
    const matchesSearch =
      risk.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.owner.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Heatmap Coordinate Filter
    if (activeCell) {
      const isMatch =
        getLikelihoodVal(risk.likelihood) === activeCell.likelihood &&
        getImpactVal(risk.impact) === activeCell.impact;
      return matchesSearch && isMatch;
    }

    return matchesSearch;
  });

  // Circle Gauge circumference logic
  const circleRadius = 50;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (riskData.riskScore / 100) * circumference;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2.5">
            <Gauge className="w-8 h-8 text-orange-500" />
            Risk Intelligence & Posture
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Visualize organizational threat vectors, compliance states, and active risk mitigation velocities.
          </p>
        </div>
        <button
          onClick={loadRiskData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold text-xs cursor-pointer transition-colors shadow-sm self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Risk Score Circle Gauge Card */}
        <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between hover:border-orange-300 transition-all col-span-1 md:col-span-2">
          <div className="flex items-center gap-5">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg width="112" height="112" className="transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={circleRadius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={circleRadius}
                  fill="none"
                  stroke="url(#score-grad)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-800">{riskData.riskScore}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800">Overall Posture</h3>
                <Badge color="red">{riskData.riskLevel} Risk</Badge>
              </div>
              <div className="flex items-center text-xs text-green-600 font-bold mt-1.5">
                <TrendingDown className="w-4 h-4 mr-0.5" />
                <span>-{riskData.previousScore - riskData.riskScore}% improvement (last 30 days)</span>
              </div>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-[280px]">
                Calculated dynamically from critical infrastructure exposures and open vulnerabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Business Impact Level */}
        <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-all">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Business Impact</p>
            <p className="text-2xl font-bold text-slate-800 mt-2 flex items-center gap-1.5">
              <Building2 className="w-5 h-5 text-orange-500" />
              {riskData.businessImpact}
            </p>
          </div>
          <p className="text-slate-400 text-xs mt-3">
            Based on active threats mapped to core payment systems and user directories.
          </p>
        </div>

        {/* Critical Assets Mapped */}
        <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-all">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Critical Exposures</p>
            <p className="text-2xl font-bold text-slate-800 mt-2 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              {riskData.criticalAssetsCount} Assets
            </p>
          </div>
          <p className="text-slate-400 text-xs mt-3">
            Priority remediation active for: K8S Cluster & S3 database containers.
          </p>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart - 2 columns */}
        <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="border-b border-orange-50 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Risk Mitigation Trend</h3>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> 6-Month Trajectory
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-[220px] mt-4 flex items-center justify-center">
            <svg viewBox="0 0 500 200" width="100%" height="100%" className="overflow-visible">
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="40" y1="57.5" x2="480" y2="57.5" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="40" y1="95" x2="480" y2="95" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="40" y1="132.5" x2="480" y2="132.5" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#e2e8f0" />

              {/* Y Axis Labels */}
              <text x="15" y="24" className="text-[10px] fill-slate-400 font-semibold text-right">100</text>
              <text x="15" y="99" className="text-[10px] fill-slate-400 font-semibold text-right">50</text>
              <text x="15" y="174" className="text-[10px] fill-slate-400 font-semibold text-right">0</text>

              {/* X Axis Gridlines */}
              <line x1="40" y1="20" x2="40" y2="170" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="128" y1="20" x2="128" y2="170" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="216" y1="20" x2="216" y2="170" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="304" y1="20" x2="304" y2="170" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="392" y1="20" x2="392" y2="170" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="480" y1="20" x2="480" y2="170" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Area Under Curve */}
              <path
                d="M 40 53 L 128 57.5 L 216 62 L 304 68 L 392 72.5 L 480 74 L 480 170 L 40 170 Z"
                fill="url(#chart-area-grad)"
              />

              {/* Main Line */}
              <path
                d="M 40 53 L 128 57.5 L 216 62 L 304 68 L 392 72.5 L 480 74"
                fill="none"
                stroke="#f97316"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Point Circles */}
              <circle cx="40" cy="53" r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" className="cursor-pointer hover:r-7 transition-all" />
              <circle cx="128" cy="57.5" r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" className="cursor-pointer hover:r-7 transition-all" />
              <circle cx="216" cy="62" r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" className="cursor-pointer hover:r-7 transition-all" />
              <circle cx="304" cy="68" r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" className="cursor-pointer hover:r-7 transition-all" />
              <circle cx="392" cy="72.5" r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" className="cursor-pointer hover:r-7 transition-all" />
              <circle cx="480" cy="74" r="5" fill="#f97316" stroke="#fff" strokeWidth="1.5" className="cursor-pointer hover:r-7 transition-all" />

              {/* Text values */}
              <text x="40" y="38" className="text-[10px] fill-slate-600 font-bold text-center font-mono">78</text>
              <text x="128" y="42" className="text-[10px] fill-slate-600 font-bold text-center font-mono">75</text>
              <text x="216" y="47" className="text-[10px] fill-slate-600 font-bold text-center font-mono">72</text>
              <text x="304" y="53" className="text-[10px] fill-slate-600 font-bold text-center font-mono">68</text>
              <text x="392" y="58" className="text-[10px] fill-slate-600 font-bold text-center font-mono">65</text>
              <text x="480" y="59" className="text-[10px] fill-slate-600 font-bold text-center font-mono">64</text>

              {/* X Axis Labels */}
              <text x="40" y="188" className="text-[10px] fill-slate-400 font-bold text-center">Jan</text>
              <text x="128" y="188" className="text-[10px] fill-slate-400 font-bold text-center">Feb</text>
              <text x="216" y="188" className="text-[10px] fill-slate-400 font-bold text-center">Mar</text>
              <text x="304" y="188" className="text-[10px] fill-slate-400 font-bold text-center">Apr</text>
              <text x="392" y="188" className="text-[10px] fill-slate-400 font-bold text-center">May</text>
              <text x="480" y="188" className="text-[10px] fill-slate-400 font-bold text-center">Jun</text>
            </svg>
          </div>
        </div>

        {/* Risk Distribution Card - 1 column */}
        <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between">
          <div className="border-b border-orange-50 pb-3">
            <h3 className="font-bold text-slate-800">Risk Category Distribution</h3>
          </div>

          <div className="space-y-4 py-2 flex-1 flex flex-col justify-around">
            {riskData.distribution.map((dist, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-600">{dist.category}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono text-[10px]">CVSS: {dist.score}</span>
                    <Badge
                      color={dist.level === 'High' ? 'red' : dist.level === 'Medium' ? 'blue' : 'green'}
                    >
                      {dist.level}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      dist.level === 'High'
                        ? 'bg-red-500'
                        : dist.level === 'Medium'
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${dist.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap & Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Matrix Card */}
        <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm col-span-1">
          <div className="border-b border-orange-50 pb-3 flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800">Likelihood vs Impact Heatmap</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Matrix Mode</span>
          </div>

          {/* 3x3 Likelihood vs Impact Matrix */}
          <div className="flex flex-col gap-2">
            {/* Impact Y Axis Headers at left */}
            <div className="grid grid-cols-12 gap-1.5">
              {/* Row 1 (High Impact) */}
              <div className="col-span-3 flex items-center justify-end text-[10px] font-bold text-slate-400 pr-1 select-none">
                HIGH
              </div>
              <div className="col-span-9 grid grid-cols-3 gap-1.5">
                {[
                  { likelihood: 0, impact: 2, bg: 'bg-yellow-400/90 text-slate-800' }, // Low L, High I
                  { likelihood: 1, impact: 2, bg: 'bg-orange-500/90 text-white' }, // Med L, High I
                  { likelihood: 2, impact: 2, bg: 'bg-red-600/95 text-white' }, // High L, High I
                ].map((cell) => {
                  const dataCell = riskData.heatmap.find(
                    (h) => h.likelihood === cell.likelihood && h.impact === cell.impact
                  );
                  const isSelected =
                    activeCell &&
                    activeCell.likelihood === cell.likelihood &&
                    activeCell.impact === cell.impact;
                  return (
                    <button
                      key={`${cell.likelihood}-${cell.impact}`}
                      onClick={() => handleCellClick(cell.likelihood, cell.impact)}
                      className={`h-14 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200 border-2 select-none hover:shadow-md ${
                        cell.bg
                      } ${isSelected ? 'border-slate-800 scale-102 ring-2 ring-slate-800/30' : 'border-transparent'}`}
                    >
                      <span className="text-xs font-bold leading-none">{dataCell?.count || 0}</span>
                      <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter mt-1 truncate max-w-full">
                        {dataCell?.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Row 2 (Medium Impact) */}
              <div className="col-span-3 flex items-center justify-end text-[10px] font-bold text-slate-400 pr-1 select-none">
                MED
              </div>
              <div className="col-span-9 grid grid-cols-3 gap-1.5">
                {[
                  { likelihood: 0, impact: 1, bg: 'bg-green-500/85 text-white' }, // Low L, Med I
                  { likelihood: 1, impact: 1, bg: 'bg-yellow-400/90 text-slate-800' }, // Med L, Med I
                  { likelihood: 2, impact: 1, bg: 'bg-orange-500/90 text-white' }, // High L, Med I
                ].map((cell) => {
                  const dataCell = riskData.heatmap.find(
                    (h) => h.likelihood === cell.likelihood && h.impact === cell.impact
                  );
                  const isSelected =
                    activeCell &&
                    activeCell.likelihood === cell.likelihood &&
                    activeCell.impact === cell.impact;
                  return (
                    <button
                      key={`${cell.likelihood}-${cell.impact}`}
                      onClick={() => handleCellClick(cell.likelihood, cell.impact)}
                      className={`h-14 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200 border-2 select-none hover:shadow-md ${
                        cell.bg
                      } ${isSelected ? 'border-slate-800 scale-102 ring-2 ring-slate-800/30' : 'border-transparent'}`}
                    >
                      <span className="text-xs font-bold leading-none">{dataCell?.count || 0}</span>
                      <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter mt-1 truncate max-w-full">
                        {dataCell?.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Row 3 (Low Impact) */}
              <div className="col-span-3 flex items-center justify-end text-[10px] font-bold text-slate-400 pr-1 select-none">
                LOW
              </div>
              <div className="col-span-9 grid grid-cols-3 gap-1.5">
                {[
                  { likelihood: 0, impact: 0, bg: 'bg-emerald-600/90 text-white' }, // Low L, Low I
                  { likelihood: 1, impact: 0, bg: 'bg-green-500/85 text-white' }, // Med L, Low I
                  { likelihood: 2, impact: 0, bg: 'bg-yellow-400/90 text-slate-800' }, // High L, Low I
                ].map((cell) => {
                  const dataCell = riskData.heatmap.find(
                    (h) => h.likelihood === cell.likelihood && h.impact === cell.impact
                  );
                  const isSelected =
                    activeCell &&
                    activeCell.likelihood === cell.likelihood &&
                    activeCell.impact === cell.impact;
                  return (
                    <button
                      key={`${cell.likelihood}-${cell.impact}`}
                      onClick={() => handleCellClick(cell.likelihood, cell.impact)}
                      className={`h-14 rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-200 border-2 select-none hover:shadow-md ${
                        cell.bg
                      } ${isSelected ? 'border-slate-800 scale-102 ring-2 ring-slate-800/30' : 'border-transparent'}`}
                    >
                      <span className="text-xs font-bold leading-none">{dataCell?.count || 0}</span>
                      <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter mt-1 truncate max-w-full">
                        {dataCell?.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* X-axis Likelihood labels below */}
            <div className="grid grid-cols-12 gap-1.5 mt-1">
              <div className="col-span-3"></div>
              <div className="col-span-9 grid grid-cols-3 text-center text-[10px] font-bold text-slate-400 select-none">
                <span>LOW</span>
                <span>MEDIUM</span>
                <span>HIGH</span>
              </div>
            </div>

            {/* Matrix label */}
            <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 select-none">
              Likelihood ➜
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 leading-relaxed mt-5">
            <p className="font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Interactive Filters:
            </p>
            Click any cell in the heatmap matrix above to filter the top scenarios list. Click again or select clear filter to dismiss.
          </div>
        </div>

        {/* Top Risks Catalog Card */}
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden col-span-1 lg:col-span-2">
          {/* Header & Filter options */}
          <div className="p-6 border-b border-orange-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Top Threat Catalog</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Priority catalog mapping business exposures to assets.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filter threats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-full sm:w-48 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all placeholder-slate-400 text-slate-700"
              />
            </div>
          </div>

          {/* Active coordinate filters display */}
          {activeCell && (
            <div className="bg-orange-50 border-b border-orange-100 px-6 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-orange-800">
                  Filtering Heatmap Coordinate:{' '}
                  <strong>
                    Likelihood: {activeCell.likelihood === 2 ? 'High' : activeCell.likelihood === 1 ? 'Medium' : 'Low'} • Impact:{' '}
                    {activeCell.impact === 2 ? 'High' : activeCell.impact === 1 ? 'Medium' : 'Low'}
                  </strong>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 text-orange-800 font-bold">
                  {filteredRisks.length} Matching
                </span>
              </div>
              <button
                onClick={() => setActiveCell(null)}
                className="text-xs font-bold text-orange-600 hover:text-orange-800 cursor-pointer"
              >
                ✕ Clear Filter
              </button>
            </div>
          )}

          {/* Risks Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-orange-100 font-semibold">
                <tr>
                  <th className="p-4 text-xs uppercase tracking-wider">Scenario</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Asset Mapping</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Likelihood</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Impact</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Risk Score</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="hover:bg-orange-50/10 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 text-xs">{risk.scenario}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{risk.id}</div>
                    </td>
                    <td className="p-4 font-semibold text-xs text-blue-600 font-mono">
                      {risk.asset}
                    </td>
                    <td className="p-4 text-xs">
                      <Badge
                        color={
                          risk.likelihood === 'High'
                            ? 'red'
                            : risk.likelihood === 'Medium'
                            ? 'blue'
                            : 'green'
                        }
                      >
                        {risk.likelihood}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs">
                      <Badge
                        color={
                          risk.impact === 'High'
                            ? 'red'
                            : risk.impact === 'Medium'
                            ? 'blue'
                            : 'green'
                        }
                      >
                        {risk.impact}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-bold text-xs text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {risk.score}/100
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">{risk.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRisks.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              No threat scenarios match your search or heatmap coordinates selection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
