'use client';

import React, { useState } from 'react';
import { apiRequest, getAuthToken } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, Download, FileText, FileSpreadsheet, File,
  ShieldCheck, BarChart3, Award, CheckCircle2, AlertCircle
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

type ReportType = 'executive' | 'technical' | 'risk';
type ReportFormat = 'json' | 'csv' | 'pdf';
type Scope = 'all' | 'critical';

const reportTypes = [
  {
    value: 'executive' as ReportType,
    label: 'Executive Report',
    description: 'High-level security posture summary for leadership',
    icon: <Award className="w-6 h-6 text-green-400" />,
  },
  {
    value: 'technical' as ReportType,
    label: 'Technical Report',
    description: 'Detailed vulnerability log with asset and status data',
    icon: <BarChart3 className="w-6 h-6 text-sky-400" />,
  },
  {
    value: 'risk' as ReportType,
    label: 'Risk Report',
    description: 'Risk intelligence matrix and asset criticality attestation',
    icon: <ShieldCheck className="w-6 h-6 text-orange-400" />,
  },
];

const formatOptions = [
  { value: 'pdf' as ReportFormat,  label: 'PDF',  icon: <File className="w-4 h-4" /> },
  { value: 'csv' as ReportFormat,  label: 'CSV',  icon: <FileSpreadsheet className="w-4 h-4" /> },
  { value: 'json' as ReportFormat, label: 'JSON', icon: <FileText className="w-4 h-4" /> },
];

export default function ReportsDashboard() {
  const [type, setType] = useState<ReportType>('executive');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [scope, setScope] = useState<Scope>('all');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const url = `${BASE_URL}/reports/generate?type=${type}&format=${format}&scope=${scope}`;

      if (format === 'json') {
        const res = await apiRequest(`/reports/generate?type=${type}&format=${format}&scope=${scope}`);
        if (res.success) {
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${type}_report_${Date.now()}.json`;
          a.click();
          setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} JSON report downloaded.`);
        }
      } else {
        // For PDF and CSV: direct fetch for blob
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Download failed (${response.status})`);
        }
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}_report_${Date.now()}.${format}`;
        a.click();
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} ${format.toUpperCase()} report downloaded.`);
      }
    } catch (e: any) {
      setError(e.message ?? 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reports & Exports</h2>
        <p className="text-sm text-slate-500 mt-1">Generate downloadable security reports in PDF, CSV, or JSON formats</p>
      </div>

      {/* Report type cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map(rt => (
          <button
            key={rt.value}
            onClick={() => setType(rt.value)}
            className={`text-left p-5 rounded-xl border transition-all ${
              type === rt.value
                ? 'bg-orange-600/10 border-orange-500/50 shadow-lg shadow-orange-900/10'
                : 'bg-slate-900 border-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="mb-3">{rt.icon}</div>
            <h3 className="text-sm font-semibold text-white mb-1">{rt.label}</h3>
            <p className="text-xs text-slate-500">{rt.description}</p>
          </button>
        ))}
      </div>

      {/* Config + Download */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-white mb-5">Export Configuration</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Format */}
            <div>
              <label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Format</label>
              <div className="flex gap-2">
                {formatOptions.map(fo => (
                  <button
                    key={fo.value}
                    onClick={() => setFormat(fo.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      format === fo.value
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {fo.icon} {fo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Scope</label>
              <div className="flex gap-2">
                {(['all', 'critical'] as Scope[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      scope === s
                        ? 'bg-orange-600 border-orange-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {s === 'all' ? 'Full Posture' : 'Critical Only'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-800/60 rounded-lg p-4 mb-5 text-sm text-slate-400">
            Generating <span className="text-white font-semibold">{reportTypes.find(r => r.value === type)?.label}</span> as{' '}
            <span className="text-white font-semibold">{format.toUpperCase()}</span> for{' '}
            <span className="text-white font-semibold">{scope === 'all' ? 'entire platform' : 'critical infrastructure only'}</span>.
          </div>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            ) : (
              <><Download className="w-4 h-4" /> Download Report</>
            )}
          </button>

          {success && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
