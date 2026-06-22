import React, { useState, useEffect } from 'react';
import { Play, Plus, RefreshCw, Terminal, Eye, CheckCircle, ShieldAlert, Clock, AlertCircle } from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function Campaigns({ onNotify }) {
  const { loading, fetchCampaigns, fetchCampaignById, startCampaign } = useAPI();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState({});

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const result = await fetchCampaigns();
    if (result.success) {
      setCampaigns(result.data);
    }
  };

  const handleStartCampaign = async (campaignId) => {
    setTriggerLoading(prev => ({ ...prev, [campaignId]: true }));
    onNotify('Triggering campaign validation runs...');
    const result = await startCampaign(campaignId);
    if (result.success) {
      onNotify('Campaign validation started successfully');
      await loadCampaigns();
    } else {
      onNotify('Failed to start campaign');
    }
    setTriggerLoading(prev => ({ ...prev, [campaignId]: false }));
  };

  const handleViewDetails = async (campaignId) => {
    setDetailsLoading(true);
    const result = await fetchCampaignById(campaignId);
    if (result.success) {
      setSelectedCampaign(result.data);
    } else {
      onNotify('Failed to load campaign execution log');
    }
    setDetailsLoading(false);
  };

  // Stats Counters
  const runningCount = campaigns.filter(c => c.status === 'Running').length;
  const completedCount = campaigns.filter(c => c.status === 'Completed').length;
  const failedCount = campaigns.filter(c => c.status === 'Failed').length;

  const stats = [
    { label: 'Running Campaigns', val: runningCount, icon: RefreshCw, color: 'text-blue-600 bg-blue-50 border-blue-100', animate: runningCount > 0 ? 'animate-spin' : '' },
    { label: 'Completed', val: completedCount, icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-100', animate: '' },
    { label: 'Failed Alerts', val: failedCount, icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-100', animate: failedCount > 0 ? 'animate-pulse' : '' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Autonomous Security Campaigns</h1>
          <p className="text-slate-500 mt-1">Deploy automated red-teaming validation runs across cloud and identity perimeters.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between hover:border-orange-300 transition-all">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{loading ? '...' : stat.val}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stat.color}`}>
                <Icon className={`w-6 h-6 ${stat.animate}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaigns Inventory Table */}
      <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-orange-50">
          <h3 className="font-bold text-lg text-slate-800">Campaign Runs Directory</h3>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-orange-100 font-semibold">
            <tr>
              <th className="p-4">Run ID</th>
              <th className="p-4">Campaign Name</th>
              <th className="p-4">Attestation Stage</th>
              <th className="p-4">Status</th>
              <th className="p-4">Progress</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-orange-50/10 transition-colors">
                <td className="p-4 font-mono text-blue-600 font-semibold">{c.id}</td>
                <td className="p-4 font-semibold text-slate-800">{c.name}</td>
                <td className="p-4 text-slate-500 font-medium">{c.currentStage}</td>
                <td className="p-4">
                  <Badge
                    color={
                      c.status === 'Running'
                        ? 'blue'
                        : c.status === 'Completed'
                        ? 'green'
                        : c.status === 'Failed'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    {c.status}
                  </Badge>
                </td>
                <td className="p-4 w-44">
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          c.status === 'Failed' ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{c.progress}%</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    {c.status === 'Pending' ? (
                      <button
                        onClick={() => handleStartCampaign(c.id)}
                        disabled={triggerLoading[c.id]}
                        className="flex items-center gap-1.5 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {triggerLoading[c.id] ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewDetails(c.id)}
                        disabled={detailsLoading}
                        className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-orange-500 transition cursor-pointer"
                        title="View Execution Logs"
                      >
                        <Eye className="w-4 h-4 inline-block" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Campaign Details Inspector Overlay Drawer */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-50 animate-in">
          <div className="bg-white h-screen w-full max-w-lg shadow-2xl p-8 overflow-y-auto flex flex-col justify-between border-l border-orange-100">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-orange-50 pb-4">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    {selectedCampaign.id}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-800 mt-2">
                    {selectedCampaign.name}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Initiated on: {selectedCampaign.createdDate}</p>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Progress Panel */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-4">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-slate-500">Validation Status</span>
                  <Badge
                    color={
                      selectedCampaign.status === 'Running'
                        ? 'blue'
                        : selectedCampaign.status === 'Completed'
                        ? 'green'
                        : selectedCampaign.status === 'Failed'
                        ? 'red'
                        : 'blue'
                    }
                  >
                    {selectedCampaign.status}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400 font-semibold">
                    <span>Active Stage: {selectedCampaign.currentStage}</span>
                    <span>{selectedCampaign.progress}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        selectedCampaign.status === 'Failed' ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${selectedCampaign.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Console logs output */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-orange-500" /> Console Execution Trace
                </h4>
                
                <div className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px] p-4 rounded-lg overflow-y-auto max-h-72 leading-relaxed space-y-2.5 shadow-inner">
                  {selectedCampaign.logs && selectedCampaign.logs.map((log, index) => {
                    const isError = log.includes('Error') || log.includes('Failed');
                    const isAlert = log.includes('Alert') || log.includes('Exposed');
                    return (
                      <div 
                        key={index} 
                        className={`border-l-2 pl-2 ${
                          isError 
                            ? 'border-red-500 text-red-400' 
                            : isAlert 
                            ? 'border-orange-500 text-orange-300 font-semibold' 
                            : 'border-slate-700 text-emerald-400'
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCampaign(null)}
              className="w-full mt-8 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-slate-900/10 transition cursor-pointer"
            >
              Close Console Viewer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
