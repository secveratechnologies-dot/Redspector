import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, Eye, Terminal, ShieldCheck } from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

const Findings = ({ onNotify }) => {
  const { loading, fetchFindings, fetchFindingById } = useAPI();
  const [findings, setFindings] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadFindings();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedFinding(null);
      }
    };
    if (selectedFinding) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFinding]);

  const loadFindings = async () => {
    const result = await fetchFindings();
    if (result.success) {
      setFindings(result.data);
    } else {
      if (onNotify) {
        onNotify('Failed to retrieve findings data');
      }
    }
  };

  const handleViewDetails = async (findingId) => {
    setDetailsLoading(true);
    const result = await fetchFindingById(findingId);
    if (result.success) {
      setSelectedFinding(result.data);
    } else {
      if (onNotify) {
        onNotify('Failed to retrieve finding details');
      }
    }
    setDetailsLoading(false);
  };

  // Dynamic counts for stats cards
  const criticalCount = findings.filter((f) => f.severity === 'Critical').length;
  const highCount = findings.filter((f) => f.severity === 'High').length;
  const mediumCount = findings.filter((f) => f.severity === 'Medium').length;
  const lowCount = findings.filter((f) => f.severity === 'Low').length;

  const stats = [
    {
      label: 'Critical Findings',
      val: criticalCount,
      icon: ShieldAlert,
      color: 'text-red-600 bg-red-50 border-red-100',
    },
    {
      label: 'High Findings',
      val: highCount,
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50 border-orange-100',
    },
    {
      label: 'Medium Findings',
      val: mediumCount,
      icon: AlertCircle,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      label: 'Low Findings',
      val: lowCount,
      icon: Info,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Findings Management</h1>
        <p className="text-slate-500 mt-1 font-medium">
          Identify, assess, and remediate security vulnerabilities detected across assets.
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-all"
            >
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-2">
                  {loading ? '...' : stat.val}
                </p>
              </div>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border mt-4 ${stat.color}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Findings Table Card */}
      <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-orange-50">
          <h3 className="font-bold text-lg text-slate-800">Active Vulnerability Catalog</h3>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-orange-100 font-semibold">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Finding Name</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Asset</th>
              <th className="p-4">Status</th>
              <th className="p-4">Owner</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {findings.map((finding) => (
              <tr
                key={finding.id}
                className="hover:bg-orange-50/10 transition-colors"
              >
                <td className="p-4 font-mono text-blue-600 font-semibold">{finding.id}</td>
                <td className="p-4 font-semibold text-slate-800">{finding.title}</td>
                <td className="p-4">
                  <Badge
                    color={
                      finding.severity === 'Critical' || finding.severity === 'High'
                        ? 'red'
                        : finding.severity === 'Medium'
                        ? 'blue'
                        : 'green'
                    }
                  >
                    {finding.severity}
                  </Badge>
                </td>
                <td className="p-4 text-slate-500 font-medium">{finding.asset}</td>
                <td className="p-4">
                  <Badge
                    color={
                      finding.status === 'Open'
                        ? 'red'
                        : finding.status === 'Verified'
                        ? 'blue'
                        : 'green'
                    }
                  >
                    {finding.status}
                  </Badge>
                </td>
                <td className="p-4 text-slate-500">{finding.owner}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleViewDetails(finding.id)}
                    disabled={detailsLoading}
                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-orange-500 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
                    title="View technical details"
                    aria-label="View technical details"
                  >
                    <Eye className="w-4 h-4 inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {findings.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            No findings currently mapped to the dashboard.
          </div>
        )}
      </div>

      {/* Finding Details Inspector Drawer */}
      {selectedFinding && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-50 animate-in"
          onClick={() => setSelectedFinding(null)}
        >
          <div
            className="bg-white h-screen w-full max-w-lg shadow-2xl p-8 overflow-y-auto flex flex-col justify-between border-l border-orange-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="finding-dialog-title"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-orange-50 pb-4">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    {selectedFinding.id}
                  </span>
                  <h2 id="finding-dialog-title" className="text-2xl font-bold text-slate-800 mt-2 flex items-center gap-2">
                    {selectedFinding.title}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Managed by: {selectedFinding.owner}</p>
                </div>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none rounded p-1"
                  aria-label="Close details"
                >
                  ✕
                </button>
              </div>

              {/* Grid: Basic Info */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Severity</p>
                  <div className="mt-1">
                    <Badge
                      color={
                        selectedFinding.severity === 'Critical' || selectedFinding.severity === 'High'
                          ? 'red'
                          : selectedFinding.severity === 'Medium'
                          ? 'blue'
                          : 'green'
                      }
                    >
                      {selectedFinding.severity}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Status</p>
                  <div className="mt-1">
                    <Badge
                      color={
                        selectedFinding.status === 'Open'
                          ? 'red'
                          : selectedFinding.status === 'Verified'
                          ? 'blue'
                          : 'green'
                      }
                    >
                      {selectedFinding.status}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 border-l">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Asset</p>
                  <p className="text-slate-700 font-semibold mt-1 truncate" title={selectedFinding.asset}>
                    {selectedFinding.asset}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500" /> Description
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed">
                  {selectedFinding.description}
                </div>
              </div>

              {/* Technical Evidence */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" /> Technical Evidence Trace
                </h4>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-lg border border-slate-800 text-xs font-mono overflow-x-auto max-h-60 overflow-y-auto whitespace-pre">
                  {selectedFinding.evidence}
                </pre>
              </div>

              {/* Remediation Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Remediation Recommendations
                </h4>
                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 text-sm text-slate-700">
                  <p className="font-medium text-emerald-800 mb-1">Recommended Action Plan:</p>
                  <p className="text-slate-600">{selectedFinding.recommendations}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedFinding(null)}
              className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-slate-900/10 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
            >
              Close Findings Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Findings;
