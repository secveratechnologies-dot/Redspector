'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, Sparkles, GitBranch, ShieldAlert, BarChart3,
  Award, ChevronRight, AlertCircle
} from 'lucide-react';

type InsightType = 'recommendation' | 'attackPath' | 'threatAnalysis' | 'riskExplanation' | 'executiveInsights';

const insightOptions: { value: InsightType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'recommendation',
    label: 'AI Recommendation',
    icon: <Sparkles className="w-5 h-5 text-pink-400" />,
    description: 'Get remediation steps and priority grading for a finding',
  },
  {
    value: 'attackPath',
    label: 'Attack Path Visualization',
    icon: <GitBranch className="w-5 h-5 text-sky-400" />,
    description: 'Trace potential attack paths across assets and vulnerabilities',
  },
  {
    value: 'threatAnalysis',
    label: 'Threat Analysis',
    icon: <ShieldAlert className="w-5 h-5 text-orange-400" />,
    description: 'AI-driven analysis of active threats targeting your posture',
  },
  {
    value: 'riskExplanation',
    label: 'Risk Explanation',
    icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
    description: 'Plain-language explanation of your current risk score',
  },
  {
    value: 'executiveInsights',
    label: 'Executive Insights',
    icon: <Award className="w-5 h-5 text-green-400" />,
    description: 'Board-level summary of security posture and business risk',
  },
];

export default function AiInsightsDashboard() {
  const [selectedType, setSelectedType] = useState<InsightType>('recommendation');
  const [payloadText, setPayloadText] = useState('{}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeOption = insightOptions.find(o => o.value === selectedType)!;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let payload: any = {};
      try { payload = JSON.parse(payloadText); } catch { /* allow empty */ }

      const res = await apiRequest('/ai/recommendation', {
        method: 'POST',
        body: JSON.stringify({ type: selectedType, payload }),
      });
      if (res.success) setResult(res.data);
      else throw new Error(res.message ?? 'AI request failed');
    } catch (e: any) {
      setError(e.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">AI Insights</h2>
        <p className="text-sm text-slate-500 mt-1">Generate AI-powered security intelligence and recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Insight type selector */}
        <div className="lg:col-span-1 space-y-3">
          {insightOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSelectedType(opt.value); setResult(null); setError(''); }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedType === opt.value
                  ? 'bg-orange-600/10 border-orange-500/50 shadow-lg shadow-orange-900/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                {opt.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{opt.description}</p>
                </div>
                {selectedType === opt.value && <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>

        {/* Right: Input + output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input panel */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                {activeOption.icon}
                <h3 className="text-base font-semibold text-white">{activeOption.label}</h3>
              </div>

              <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">
                Payload (JSON)
              </label>
              <textarea
                className="w-full bg-slate-800 text-slate-300 p-3 rounded-lg h-28 text-xs font-mono border border-slate-700 focus:border-orange-500 focus:outline-none resize-none"
                placeholder='{ "findingId": "FND-001" }'
                value={payloadText}
                onChange={e => setPayloadText(e.target.value)}
              />

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating insight…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Insight
                  </>
                )}
              </button>

              {error && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output panel */}
          {result && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold text-white mb-3">
                  {activeOption.icon}
                  <span className="ml-2">{activeOption.label} — Result</span>
                </h4>
                {/* Render structured fields if present, else raw JSON */}
                {result.recommendation || result.issue ? (
                  <div className="space-y-3 text-sm">
                    {result.issue && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Issue</p>
                        <p className="text-slate-300">{result.issue}</p>
                      </div>
                    )}
                    {result.impact && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Impact</p>
                        <p className="text-slate-300">{result.impact}</p>
                      </div>
                    )}
                    {result.recommendation && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Recommendation</p>
                        <p className="text-slate-300">{result.recommendation}</p>
                      </div>
                    )}
                    {result.priority && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase mb-1">Priority</p>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          result.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          result.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {result.priority}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs overflow-x-auto max-h-80">
{JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
