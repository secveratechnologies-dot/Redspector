import React, { useState, useEffect } from 'react';
import { Server, Globe, ShieldAlert, Cpu, Layers, Tag, Eye, Info, Shield, HelpCircle, Activity } from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function Assets({ onNotify }) {
  const { loading, fetchAssets, fetchAssetById } = useAPI();
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const result = await fetchAssets();
    if (result.success) {
      setAssets(result.data);
    }
  };

  const handleViewDetails = async (assetId) => {
    setDetailsLoading(true);
    const result = await fetchAssetById(assetId);
    if (result.success) {
      setSelectedAsset(result.data);
    } else {
      onNotify('Failed to retrieve asset details');
    }
    setDetailsLoading(false);
  };

  // Dynamic counts for stats cards
  const totalAssets = assets.length;
  const criticalAssets = assets.filter(a => a.critical).length;
  const domainsCount = assets.filter(a => a.type === 'Domain' || a.type === 'S3 Bucket').length;
  const ipAddressesCount = assets.filter(a => a.type === 'IP Address' || a.type === 'Cluster').length;
  const apisCount = assets.filter(a => a.type === 'API').length;

  const stats = [
    { label: 'Total Assets', val: totalAssets, icon: Server, color: 'text-slate-800 bg-slate-50 border-slate-100' },
    { label: 'Domains', val: domainsCount, icon: Globe, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { label: 'IP Addresses', val: ipAddressesCount, icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'APIs', val: apisCount, icon: Layers, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { label: 'Critical Assets', val: criticalAssets, icon: ShieldAlert, color: 'text-orange-600 bg-orange-50 border-orange-100' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Asset Management</h1>
        <p className="text-slate-500 mt-1">Discover, classify, and track security exposure across organization assets.</p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-all">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{loading ? '...' : stat.val}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border mt-4 ${stat.color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset Table Card */}
      <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-orange-50">
          <h3 className="font-bold text-lg text-slate-800">Monitored Assets Inventory</h3>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-orange-100 font-semibold">
            <tr>
              <th className="p-4">Asset ID</th>
              <th className="p-4">Asset Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Risk</th>
              <th className="p-4">Owner</th>
              <th className="p-4">Environment</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((asset) => (
              <tr
                key={asset.id}
                className="hover:bg-orange-50/10 transition-colors"
              >
                <td className="p-4 font-mono text-blue-600 font-semibold">{asset.id}</td>
                <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                  {asset.critical && (
                    <span className="w-2 h-2 rounded-full bg-orange-500" title="Business Critical" />
                  )}
                  {asset.name}
                </td>
                <td className="p-4 text-slate-500 font-medium">{asset.type}</td>
                <td className="p-4">
                  <Badge
                    color={
                      asset.risk === 'High'
                        ? 'red'
                        : asset.risk === 'Medium'
                        ? 'blue'
                        : 'green'
                    }
                  >
                    {asset.risk}
                  </Badge>
                </td>
                <td className="p-4 text-slate-500">{asset.owner}</td>
                <td className="p-4 text-slate-500">
                  <Badge variant={asset.environment === 'Production' ? 'red' : 'blue'} label={asset.environment} />
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleViewDetails(asset.id)}
                    disabled={detailsLoading}
                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-orange-500 transition cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assets.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No assets currently mapped to the dashboard.
          </div>
        )}
      </div>

      {/* Asset Details Inspector Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-50 animate-in">
          <div className="bg-white h-screen w-full max-w-lg shadow-2xl p-8 overflow-y-auto flex flex-col justify-between border-l border-orange-100">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-orange-50 pb-4">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                    {selectedAsset.id}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-800 mt-2 flex items-center gap-2">
                    {selectedAsset.critical && <Shield className="w-5 h-5 text-orange-500 fill-orange-500" />}
                    {selectedAsset.name}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Managed by: {selectedAsset.owner}</p>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Compliance Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAsset.tags && selectedAsset.tags.map((tag) => (
                    <Badge key={tag} variant="blue" label={tag} />
                  ))}
                </div>
              </div>

              {/* Grid 1: Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Asset Type</p>
                  <p className="text-slate-700 font-semibold mt-1">{selectedAsset.type}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Environment</p>
                  <p className="text-slate-700 font-semibold mt-1">{selectedAsset.environment}</p>
                </div>
              </div>

              {/* Risk Information */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-orange-500" /> Security Risk Assessment
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">CVSS Exposure Score</span>
                  <span className="font-bold text-slate-800">{selectedAsset.riskInfo?.score}/100</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Compliance Verification</span>
                  <Badge
                    color={selectedAsset.riskInfo?.complianceState === 'Compliant' ? 'green' : 'red'}
                  >
                    {selectedAsset.riskInfo?.complianceState}
                  </Badge>
                </div>
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-400 mb-1.5">Vulnerability Breakdown</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-800 font-bold">
                      {selectedAsset.riskInfo?.vulnerabilities?.critical} Critical
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 font-bold">
                      {selectedAsset.riskInfo?.vulnerabilities?.high} High
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-bold">
                      {selectedAsset.riskInfo?.vulnerabilities?.medium} Medium
                    </span>
                  </div>
                </div>
              </div>

              {/* Exposure Data */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Globe className="w-3.5 h-3.5 text-blue-500" /> Exposure Telemetry
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Public Visibility</span>
                    <span className="font-medium text-slate-700">{selectedAsset.exposureData?.visibility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Ports</span>
                    <span className="font-mono text-slate-600 text-xs">{selectedAsset.exposureData?.ports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SSL Certificate</span>
                    <span className="text-xs text-slate-600">{selectedAsset.exposureData?.sslCert}</span>
                  </div>
                </div>
              </div>

              {/* Threat Information */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" /> Real-time Threat Intelligence
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attacker Recon Activity</span>
                    <span className="font-medium text-slate-700">{selectedAsset.threatInfo?.reconProbes}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Alert Status</p>
                    <p className="text-xs font-semibold text-red-600 mt-1">{selectedAsset.threatInfo?.status}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedAsset(null)}
              className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-slate-900/10 transition cursor-pointer"
            >
              Close Asset Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
