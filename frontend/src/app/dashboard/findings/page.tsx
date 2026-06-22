'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface Finding {
  id: string;
  title: string;
  severity: string;
  asset: string;
  status: string;
  description?: string;
  remediation?: string;
  owner?: string;
}

const severityColors: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
  High:     'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  Medium:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Low:      'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Info:     'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

export default function FindingsDashboard() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Finding | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('/findings');
        if (res.success && Array.isArray(res.data)) setFindings(res.data);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load findings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading findings…</span>
      </div>
    );
  }

  const filtered = filterSeverity === 'All'
    ? findings
    : findings.filter(f => f.severity === filterSeverity);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Findings</h2>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Critical', 'High', 'Medium', 'Low', 'Info'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                filterSeverity === s
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {filtered.length === 0 && !error && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-400">No findings match the selected filter.</p>
          </CardContent>
        </Card>
      )}

      {/* Findings Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase text-xs">ID</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase text-xs">Title</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase text-xs">Asset</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase text-xs">Severity</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-semibold uppercase text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setSelected(f)}
                    className="border-b border-slate-800/60 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{f.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{f.title}</td>
                    <td className="px-4 py-3 text-slate-400">{f.asset}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${severityColors[f.severity] ?? ''}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Finding Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Finding Details</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Title</p>
                <p className="text-white font-semibold">{selected.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Severity</p>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${severityColors[selected.severity] ?? ''}`}>
                    {selected.severity}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Status</p>
                  <p className="text-slate-300">{selected.status}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Asset</p>
                <p className="text-slate-300">{selected.asset}</p>
              </div>
              {selected.description && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Description</p>
                  <p className="text-slate-300 text-sm">{selected.description}</p>
                </div>
              )}
              {selected.remediation && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Remediation</p>
                  <p className="text-slate-300 text-sm">{selected.remediation}</p>
                </div>
              )}
              {selected.owner && (
                <div>
                  <p className="text-xs text-slate-500 uppercase mb-1">Owner</p>
                  <p className="text-slate-300 text-sm">{selected.owner}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 uppercase mb-1">Finding ID</p>
                <p className="text-slate-500 font-mono text-xs">{selected.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
