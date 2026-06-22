'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { AlertTriangle, ShieldCheck, ShieldAlert, Award, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Finding {
  id: string;
  title: string;
  severity: string;
  asset: string;
  status: string;
}

/**
 * Main security overview dashboard page.
 */
export default function DashboardPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await apiRequest('/findings');
        if (res.success && Array.isArray(res.data)) {
          setFindings(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve active findings.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeFindings = findings.filter(f => f.status === 'Open' || f.status === 'Verified');
  const criticalCount = activeFindings.filter(f => f.severity === 'Critical' || f.severity === 'High').length;
  const mediumCount = activeFindings.filter(f => f.severity === 'Medium').length;
  const lowCount = activeFindings.filter(f => f.severity === 'Low' || f.severity === 'Info').length;

  const stats = [
    { label: 'Total Scoped Findings', val: findings.length, icon: ShieldCheck, color: 'text-blue-500' },
    { label: 'Active Risks', val: activeFindings.length, icon: ShieldAlert, color: 'text-red-500' },
    { label: 'Critical / High Threats', val: criticalCount, icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Compliance Health', val: `${findings.length > 0 ? Math.round(((findings.length - activeFindings.length) / findings.length) * 100) : 100}%`, icon: Award, color: 'text-green-500' }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-slate-400">Loading system metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all shadow-md">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-extrabold text-white mt-2">{stat.val}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical activity list */}
      <Card className="bg-slate-900 border-slate-800 shadow-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-white mb-6">
            Critical Active Vulnerability Log
          </h3>

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}

          {activeFindings.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">All systems clear. No active findings detected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="flex items-center justify-between p-4 border border-slate-800 rounded-xl bg-slate-950/40 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white text-sm">{finding.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Asset: <strong className="text-slate-400">{finding.asset}</strong> • ID: {finding.id}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    finding.severity === 'Critical' || finding.severity === 'High'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
