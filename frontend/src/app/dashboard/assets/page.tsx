'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Server, Search, ShieldCheck, X } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: string;
  owner: string;
  risk: string;
  cves?: string[];
}

const riskColors: Record<string, string> = {
  High:   'bg-red-500/10 text-red-400 border border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Low:    'bg-green-500/10 text-green-400 border border-green-500/20',
};

export default function AssetsDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [selected, setSelected] = useState<Asset | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('/assets');
        if (res.success && Array.isArray(res.data)) setAssets(res.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load assets');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading assets…</span>
      </div>
    );
  }

  const filtered = assets
    .filter(a => filterRisk === 'All' || a.risk === filterRisk)
    .filter(a =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.owner.toLowerCase().includes(search.toLowerCase())
    );

  const highCount   = assets.filter(a => a.risk === 'High').length;
  const mediumCount = assets.filter(a => a.risk === 'Medium').length;
  const lowCount    = assets.filter(a => a.risk === 'Low').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Assets</h2>
          <p className="text-sm text-slate-500 mt-1">{assets.length} assets monitored</p>
        </div>
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'High Risk', count: highCount, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Medium Risk', count: mediumCount, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Low Risk', count: lowCount, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(({ label, count, color, bg }) => (
          <Card key={label} className="bg-slate-900 border-slate-800">
            <CardContent className={`p-4 text-center ${bg} rounded-xl`}>
              <p className={`text-3xl font-bold ${color}`}>{count}</p>
              <p className={`text-xs font-semibold uppercase mt-1 ${color}`}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'High', 'Medium', 'Low'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                filterRisk === r
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {filtered.length === 0 && !error && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No assets match the current filter.</p>
          </CardContent>
        </Card>
      )}

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(asset => (
          <Card
            key={asset.id}
            className="bg-slate-900 border-slate-800 hover:border-orange-500/40 transition-all shadow-md cursor-pointer group"
            onClick={() => setSelected(asset)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                    {asset.name}
                  </h3>
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${riskColors[asset.risk] ?? 'bg-slate-700 text-slate-300'}`}>
                  {asset.risk}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-1">Type: <span className="text-slate-300">{asset.type}</span></p>
              <p className="text-xs text-slate-500">Owner: <span className="text-slate-300">{asset.owner}</span></p>
              {asset.cves && asset.cves.length > 0 && (
                <p className="text-xs text-orange-400 mt-2">⚠ {asset.cves.length} CVE{asset.cves.length > 1 ? 's' : ''} linked</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Asset Details</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Name</p>
                <p className="text-white font-semibold">{selected.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Type</p>
                  <p className="text-slate-300">{selected.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Risk</p>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${riskColors[selected.risk] ?? ''}`}>
                    {selected.risk}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Owner</p>
                <p className="text-slate-300">{selected.owner}</p>
              </div>
              {selected.cves && selected.cves.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-2">Linked CVEs</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.cves.map(cve => (
                      <span key={cve} className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-xs font-mono">
                        {cve}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Asset ID</p>
                <p className="text-slate-500 font-mono text-xs">{selected.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
