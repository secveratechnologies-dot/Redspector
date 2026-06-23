'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, Sparkles, GitBranch, ShieldAlert, BarChart3,
  Award, ChevronRight, AlertCircle, Play, CheckCircle2,
  Server, Laptop, Cpu, ShieldCheck
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

const defaultPayloads: Record<InsightType, string> = {
  recommendation: '{\n  "finding": {\n    "title": "Insecure JWT validation controls",\n    "severity": "High",\n    "asset": "api.internal"\n  }\n}',
  attackPath: '{\n  "asset": "api.internal"\n}',
  threatAnalysis: '{\n  "technologies": ["Node.js", "PostgreSQL", "AWS S3"]\n}',
  riskExplanation: '{\n  "riskScore": 75\n}',
  executiveInsights: '{\n  "riskScore": 75,\n  "complianceScore": 88,\n  "openFindings": 14\n}'
};

export default function AiInsightsDashboard() {
  const [selectedType, setSelectedType] = useState<InsightType>('recommendation');
  const [payloadText, setPayloadText] = useState(defaultPayloads.recommendation);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeOption = insightOptions.find(o => o.value === selectedType)!;

  const handleTypeChange = (type: InsightType) => {
    setSelectedType(type);
    setPayloadText(defaultPayloads[type]);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let payload: any = {};
      try {
        payload = JSON.parse(payloadText);
      } catch {
        throw new Error('Invalid JSON payload. Please verify format.');
      }

      // Updated to correct /ai/insights dispatcher path
      const res = await apiRequest('/ai/insights', {
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
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500 fill-orange-500/10" />
          AI Insights
        </h2>
        <p className="text-sm text-slate-500 mt-1">Generate AI-powered security intelligence and recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Insight type selector */}
        <div className="lg:col-span-1 space-y-3">
          {insightOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleTypeChange(opt.value)}
              className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                selectedType === opt.value
                  ? 'bg-orange-600/10 border-orange-500/50 shadow-lg shadow-orange-900/10'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{opt.description}</p>
                </div>
                {selectedType === opt.value && <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>

        {/* Right: Input + output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input panel */}
          <Card className="bg-slate-900 border-slate-800 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                  {activeOption.icon}
                </div>
                <h3 className="text-base font-bold text-white">{activeOption.label} Input Parameters</h3>
              </div>

              <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block">
                Payload Parameters (JSON)
              </label>
              <textarea
                className="w-full bg-slate-950 text-slate-300 p-3 rounded-lg h-36 text-xs font-mono border border-slate-800 focus:border-orange-500 focus:outline-none resize-none leading-relaxed"
                value={payloadText}
                onChange={e => setPayloadText(e.target.value)}
              />

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg disabled:opacity-50 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-950/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating intelligence…
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
                  <p className="text-sm text-red-400 font-semibold">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structured Output display */}
          {result && (
            <Card className="bg-slate-900 border-slate-800 shadow-md animate-in duration-300">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  {activeOption.icon}
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    {activeOption.label} Result
                  </h4>
                </div>

                {/* 1. Recommendation Result */}
                {selectedType === 'recommendation' && (
                  <div className="space-y-4 text-sm">
                    {result.issue && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Identified Issue</p>
                        <p className="text-slate-300 font-semibold leading-relaxed bg-slate-950/40 border border-slate-800 p-3 rounded-lg">{result.issue}</p>
                      </div>
                    )}
                    {result.impact && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Technical & Business Impact</p>
                        <p className="text-slate-300 font-semibold leading-relaxed bg-slate-950/40 border border-slate-800 p-3 rounded-lg">{result.impact}</p>
                      </div>
                    )}
                    {result.recommendation && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Step-by-Step Remediation</p>
                        <div className="text-slate-300 font-semibold leading-relaxed bg-slate-950/40 border border-slate-800 p-4 rounded-lg whitespace-pre-line">
                          {result.recommendation}
                        </div>
                      </div>
                    )}
                    {result.priority && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5">Remediation Priority</p>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          result.priority === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          result.priority === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                          result.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                          'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {result.priority}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Attack Path Result */}
                {selectedType === 'attackPath' && result.paths && (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      {result.summary}
                    </p>
                    <div className="flex flex-col items-center gap-4 py-4 relative">
                      {result.paths.map((pathItem: any, index: number) => (
                        <React.Fragment key={index}>
                          <div className="w-full max-w-md p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4 shadow-sm hover:border-slate-700 transition-all">
                            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-extrabold text-sm flex-shrink-0">
                              {pathItem.step}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Node: {pathItem.node}</p>
                              <p className="text-sm font-bold text-white mt-0.5 truncate">{pathItem.technique}</p>
                              <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                pathItem.severity === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                pathItem.severity === 'High' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {pathItem.severity}
                              </span>
                            </div>
                          </div>
                          {index < result.paths.length - 1 && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-500 animate-bounce my-0.5">
                              <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Threat Analysis Result */}
                {selectedType === 'threatAnalysis' && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Active threat groups</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.activeThreatGroups?.map((group: string) => (
                            <span key={group} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold rounded-lg text-xs">
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Targeted technologies</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.targetedTechnologies?.map((tech: string) => (
                            <span key={tech} className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 font-semibold rounded-lg text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">MITRE ATT&CK Tactics Affected</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.mitreTactics?.map((tactic: string) => (
                          <span key={tactic} className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold rounded-lg text-xs">
                            {tactic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {result.recommendation && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5">Mitre Mitigation Advice</p>
                        <p className="text-slate-300 font-semibold leading-relaxed bg-slate-950/40 border border-slate-800 p-3 rounded-lg">
                          {result.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Risk Explanation Result */}
                {selectedType === 'riskExplanation' && (
                  <div className="space-y-5 text-sm">
                    <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-xl border-4 ${
                        result.level === 'High' ? 'border-red-500 text-red-400 bg-red-500/5' :
                        result.level === 'Medium' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5' :
                        'border-green-500 text-green-400 bg-green-500/5'
                      }`}>
                        {result.score}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Calculated Severity</p>
                        <p className={`text-lg font-extrabold ${
                          result.level === 'High' ? 'text-red-400' :
                          result.level === 'Medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>{result.level} Posture Risk</p>
                      </div>
                    </div>

                    {result.plainLanguage && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1.5">Overview</p>
                        <p className="text-slate-300 font-semibold leading-relaxed">
                          {result.plainLanguage}
                        </p>
                      </div>
                    )}

                    {result.topDrivers && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Key Risk Drivers</p>
                        <ul className="space-y-2">
                          {result.topDrivers.map((driver: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                              <span className="font-semibold">{driver}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Executive Insights Result */}
                {selectedType === 'executiveInsights' && (
                  <div className="space-y-5 text-sm">
                    {result.headline && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Board Summary</p>
                        <p className="text-base font-bold text-orange-400 leading-snug">{result.headline}</p>
                      </div>
                    )}

                    {/* Metrics Grid */}
                    {result.metrics && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Risk Score</p>
                          <p className="text-lg font-bold text-white mt-0.5">{result.metrics.overallRisk}</p>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compliance</p>
                          <p className="text-lg font-bold text-white mt-0.5">{result.metrics.complianceHealth}%</p>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Open Findings</p>
                          <p className="text-lg font-bold text-white mt-0.5">{result.metrics.openFindings}</p>
                        </div>
                      </div>
                    )}

                    {result.keyRisks && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2.5">Identified Exposure Risks</p>
                        <ul className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                          {result.keyRisks.map((risk: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                              <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <span className="font-semibold leading-relaxed">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.recommendations && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2.5">Strategic Recommendations</p>
                        <ul className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                          {result.recommendations.map((reco: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="font-semibold leading-relaxed">{reco}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
