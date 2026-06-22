'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Play, Pause, Square, Clock } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  targetUrl?: string;
  startDate?: string;
  endDate?: string;
}

const statusColor: Record<string, string> = {
  Active: 'bg-green-500/10 text-green-400 border border-green-500/20',
  Paused: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Completed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Stopped: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const statusIcon: Record<string, React.ReactNode> = {
  Active: <Play className="w-4 h-4 text-green-400" />,
  Paused: <Pause className="w-4 h-4 text-yellow-400" />,
  Completed: <Square className="w-4 h-4 text-blue-400" />,
  Stopped: <Square className="w-4 h-4 text-red-400" />,
};

export default function CampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest('/campaigns');
        if (res.success && Array.isArray(res.data)) setCampaigns(res.data);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading campaigns…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Campaigns</h2>
        <span className="text-sm text-slate-400">{campaigns.length} total</span>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {campaigns.length === 0 && !error && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-12 text-center">
            <Play className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No campaigns found. Create your first campaign to get started.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => (
          <Card
            key={c.id}
            className="bg-slate-900 border-slate-800 hover:border-orange-500/40 transition-all shadow-md cursor-pointer group"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {statusIcon[c.status] ?? <Clock className="w-4 h-4 text-slate-400" />}
                  <h3 className="text-base font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                    {c.name}
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${statusColor[c.status] ?? 'bg-slate-700 text-slate-300'}`}>
                  {c.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-mono truncate mb-3">ID: {c.id}</p>

              {c.targetUrl && (
                <p className="text-sm text-slate-400 truncate mb-1">
                  Target: <span className="text-slate-300">{c.targetUrl}</span>
                </p>
              )}

              <div className="flex gap-4 mt-3 text-xs text-slate-500">
                {c.startDate && <span>Started: {new Date(c.startDate).toLocaleDateString()}</span>}
                {c.endDate && <span>Ended: {new Date(c.endDate).toLocaleDateString()}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
