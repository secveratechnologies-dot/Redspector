import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowRight,
  Server,
  UserX,
  Skull,
  CheckCircle,
  RefreshCw,
  Cpu,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Search,
  Database,
  BookOpen,
  PlusCircle,
} from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function AIInsights({ onNotify }) {
  const {
    loading,
    fetchFindings,
    fetchAIRecommendations,
    executeAIRecommendation,
    analyzeFindingWithAI,
    storeRagContext,
    searchRagContext,
  } = useAPI();

  const [findings, setFindings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedFindingId, setSelectedFindingId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [automatingId, setAutomatingId] = useState(null);

  // Active Attack Path selection state
  const [activePathScenario, setActivePathScenario] = useState('s3'); // 's3', 'k8s', 'api'

  // Tab & RAG states
  const [activeTab, setActiveTab] = useState('threat'); // 'threat', 'rag'
  const [ragSource, setRagSource] = useState('Policy');
  const [ragSourceId, setRagSourceId] = useState('');
  const [ragContent, setRagContent] = useState('');
  const [ragQuery, setRagQuery] = useState('');
  const [ragLimit, setRagLimit] = useState(5);
  const [ragResults, setRagResults] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragStoreLoading, setRagStoreLoading] = useState(false);

  const handleStoreRagContext = async (e) => {
    e.preventDefault();
    if (!ragSourceId || !ragContent) {
      if (onNotify) onNotify('Source ID and Content are required', 'warning');
      return;
    }
    setRagStoreLoading(true);
    const res = await storeRagContext({
      source: ragSource,
      sourceId: ragSourceId,
      content: ragContent
    });
    setRagStoreLoading(false);
    if (res.success) {
      if (onNotify) onNotify('RAG Context stored successfully!', 'success');
      setRagSourceId('');
      setRagContent('');
    } else {
      if (onNotify) onNotify(`Failed to store RAG Context: ${res.message || 'unknown error'}`, 'critical');
    }
  };

  const handleSearchRagContext = async (e) => {
    e.preventDefault();
    if (!ragQuery) {
      if (onNotify) onNotify('Search query is required', 'warning');
      return;
    }
    setRagLoading(true);
    const res = await searchRagContext(ragQuery, ragLimit);
    setRagLoading(false);
    if (res.success) {
      setRagResults(res.data || []);
      if (onNotify) onNotify(`Found ${res.data?.length || 0} similarity results!`, 'info');
    } else {
      if (onNotify) onNotify('RAG Similarity Search failed', 'critical');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const findingsResult = await fetchFindings();
    if (findingsResult.success) {
      setFindings(findingsResult.data);
      if (findingsResult.data.length > 0) {
        setSelectedFindingId(findingsResult.data[0].id);
        // Pre-run analysis for first finding
        runFindingAnalysis(findingsResult.data[0].id);
      }
    }

    const recsResult = await fetchAIRecommendations();
    if (recsResult.success) {
      setRecommendations(recsResult.data);
    }
  };

  const handleAutomate = async (recId) => {
    setAutomatingId(recId);
    const result = await executeAIRecommendation(recId);
    if (result.success) {
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, automated: true } : r))
      );
      if (onNotify) {
        onNotify(`AI Planner successfully automated deployment of policy rules: ${result.data.title}`);
      }
    } else {
      if (onNotify) {
        onNotify('Failed to execute automated remediation action');
      }
    }
    setAutomatingId(null);
  };

  const runFindingAnalysis = async (findingId) => {
    setAnalysisLoading(true);
    const result = await analyzeFindingWithAI(findingId);
    if (result.success) {
      setAnalysis(result.data);
    } else {
      if (onNotify) {
        onNotify('Failed to complete AI deep-dive analysis');
      }
    }
    setAnalysisLoading(false);
  };

  // Attack Path definitions
  const attackPaths = {
    s3: {
      title: 'Public S3 Data Exfiltration Pathway',
      description: 'An attacker leverages public read/write configurations to scan resources, insert web shells, and leak corporate storage objects.',
      nodes: [
        { label: 'Asset Node', val: 'S3-PROD-01', sub: 'AWS Storage Bucket', icon: Server, color: 'border-blue-200 bg-blue-50 text-blue-800' },
        { label: 'Threat Actor', val: 'Anonymous Web Crawler', sub: 'Automated scraping botnet', icon: UserX, color: 'border-red-200 bg-red-50 text-red-800' },
        { label: 'Vulnerability Vector', val: 'Public Access Policy (*)', sub: 'Unrestricted s3:PutObject', icon: ShieldAlert, color: 'border-orange-200 bg-orange-50 text-orange-800' },
        { label: 'Business Risk Outcome', val: 'Data Defiltration', sub: 'Ransomware database loss', icon: Skull, color: 'border-slate-800 bg-slate-900 text-white' },
      ]
    },
    k8s: {
      title: 'Kubernetes Control Plane Host Takeover',
      description: 'Adversaries compromise an exposed web service pod and exploit kernel memory flaws to escape boundaries to the host node.',
      nodes: [
        { label: 'Asset Node', val: 'K8S-CLUSTER-EU', sub: 'Production Cluster Host', icon: Cpu, color: 'border-blue-200 bg-blue-50 text-blue-800' },
        { label: 'Threat Actor', val: 'Compromised Node Process', sub: 'Internal cap_sys_admin bypass', icon: UserX, color: 'border-red-200 bg-red-50 text-red-800' },
        { label: 'Vulnerability Vector', val: 'Dirty Pipe (CVE-2022-0847)', sub: 'Writable host page-cache bug', icon: ShieldAlert, color: 'border-orange-200 bg-orange-50 text-orange-800' },
        { label: 'Business Risk Outcome', val: 'Full Node Escape Control', sub: 'Cluster-wide root takeover', icon: Skull, color: 'border-slate-800 bg-slate-900 text-white' },
      ]
    },
    api: {
      title: 'Checkout API Session Hijacking',
      description: 'An unauthenticated attacker performs rapid checkout requests to bypass validation tokens and trigger downstream billing webhooks.',
      nodes: [
        { label: 'Asset Node', val: 'api.redspecter.io/checkout', sub: 'Billing Checkout Endpoint', icon: Layers, color: 'border-blue-200 bg-blue-50 text-blue-800' },
        { label: 'Threat Actor', val: 'Credential Spoofing Bot', sub: 'Distributed IP attack matrix', icon: UserX, color: 'border-red-200 bg-red-50 text-red-800' },
        { label: 'Vulnerability Vector', val: 'Missing Bearer JWT Signatures', sub: 'Unfiltered transaction routing', icon: ShieldAlert, color: 'border-orange-200 bg-orange-50 text-orange-800' },
        { label: 'Business Risk Outcome', val: 'Payment Fraud Injections', sub: 'Financial loss & API throttling', icon: Skull, color: 'border-slate-800 bg-slate-900 text-white' },
      ]
    }
  };

  const activePath = attackPaths[activePathScenario];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2.5">
          <Sparkles className="w-8 h-8 text-orange-500 fill-orange-100" />
          AI Insights Dashboard
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Remediate network vulnerability exposures using AI planning and attack vector simulations.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-orange-100">
        <button
          onClick={() => setActiveTab('threat')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition select-none cursor-pointer ${
            activeTab === 'threat'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Threat Planner & Simulations
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition select-none cursor-pointer ${
            activeTab === 'rag'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          Context Engine (RAG Knowledge Base)
        </button>
      </div>

      {activeTab === 'threat' && (
        <>
          {/* Grid: AI Recommendations & Attack Path Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Actionable Recommendations (Left Panel: 7 cols) */}
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm lg:col-span-7 space-y-4">
              <div className="border-b border-orange-50 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                  Automated AI Remediation Planner
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Actions Pending: {recommendations.filter(r => !r.automated).length}
                </span>
              </div>

              <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                      rec.automated
                        ? 'bg-green-50/40 border-green-100'
                        : 'bg-slate-50/50 border-slate-100 hover:border-orange-200'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                          {rec.id}
                        </span>
                        <Badge color={rec.priority === 'Critical' || rec.priority === 'High' ? 'red' : 'blue'}>
                          {rec.priority} Priority
                        </Badge>
                        <span className="text-xs text-slate-400 font-semibold">{rec.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{rec.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[480px]">
                        {rec.description}
                      </p>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1">
                        Target Resource: <span className="font-mono text-blue-500">{rec.target}</span>
                      </div>
                    </div>

                    <div className="self-end sm:self-auto flex-shrink-0">
                      {rec.automated ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold bg-green-100/50 border border-green-200 px-3 py-1.5 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <span>Rule Enforced</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAutomate(rec.id)}
                          disabled={automatingId === rec.id}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50"
                        >
                          {automatingId === rec.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Remediating...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-orange-400 fill-orange-400" />
                              <span>Remediate</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attack Path Visual Visualizer (Right Panel: 5 cols) */}
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm lg:col-span-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-orange-50 pb-3">
                  <h3 className="font-bold text-slate-800">Predictive Exploitation Paths</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Dynamic graphs modeling sequence of vector vulnerabilities.
                  </p>
                </div>

                {/* Scenario selectors */}
                <div className="flex gap-2">
                  {Object.keys(attackPaths).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActivePathScenario(key)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer select-none ${
                        activePathScenario === key
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {key === 's3' ? 'S3 Storage' : key === 'k8s' ? 'K8s Cluster' : 'Payment API'}
                    </button>
                  ))}
                </div>

                {/* Scenario Details */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-1.5">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                    {activePath.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {activePath.description}
                  </p>
                </div>

                {/* Attack Path Visual Diagram */}
                <div className="relative py-4 flex flex-col items-center gap-4">
                  {activePath.nodes.map((node, i) => {
                    const NodeIcon = node.icon;
                    return (
                      <React.Fragment key={i}>
                        {/* Node Card */}
                        <div
                          className={`w-full max-w-sm rounded-xl border p-3.5 flex items-center gap-4 shadow-sm hover:shadow transition-all ${
                            node.color
                          }`}
                        >
                          <div className="p-2.5 bg-white/70 rounded-lg border border-slate-100/50 flex-shrink-0">
                            <NodeIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-wider font-extrabold opacity-60">
                              {node.label}
                            </p>
                            <p className="font-extrabold text-xs truncate mt-0.5">{node.val}</p>
                            <p className="text-[10px] opacity-75 truncate">{node.sub}</p>
                          </div>
                        </div>

                        {/* SVG Connector Arrow below card (except last card) */}
                        {i < activePath.nodes.length - 1 && (
                          <div className="flex flex-col items-center justify-center -my-2 select-none">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-orange-500 animate-bounce"
                            >
                              <path
                                d="M12 4V20M12 20L6 14M12 20L18 14"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* AI Deep-Dive Finding Analyzer */}
          <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm space-y-6">
            <div className="border-b border-orange-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                  AI Vulnerability Deep-Dive Inspector
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Select an active catalog finding to generate instant threat models and remediation vectors.
                </p>
              </div>

              {/* Finding Selector & Analyze Action Trigger */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedFindingId}
                  onChange={(e) => setSelectedFindingId(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none transition-all text-slate-700 bg-white"
                >
                  {findings.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id} • {f.title} ({f.severity})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => runFindingAnalysis(selectedFindingId)}
                  disabled={analysisLoading || !selectedFindingId}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
                >
                  {analysisLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                      <span>Run AI Deep Dive</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Analysis Result Board */}
            {analysisLoading ? (
              /* Premium Skeleton Loader */
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-100 rounded-lg" />
                <div className="h-24 bg-slate-100 rounded-lg" />
                <div className="h-28 bg-slate-100 rounded-lg" />
              </div>
            ) : (
              analysis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Threat Summary */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                      <UserX className="w-4 h-4 text-red-500" /> AI Threat Summary
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {analysis.threatSummary}
                    </p>
                  </div>

                  {/* Risk Analysis */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                      <ShieldAlert className="w-4 h-4 text-orange-500" /> AI Risk Impact Assessment
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      {analysis.riskAnalysis}
                    </p>
                  </div>

                  {/* Actionable mitigation check-list */}
                  <div className="bg-emerald-50/20 p-5 rounded-xl border border-emerald-100/50 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800/60 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Automated Mitigation Checklist
                    </h4>
                    <div className="space-y-2.5 text-xs text-slate-700">
                      {analysis.suggestedActions.map((action, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer hover:text-slate-900 transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-emerald-300 bg-white accent-emerald-500 mt-0.5 cursor-pointer flex-shrink-0"
                          />
                          <span className="font-semibold leading-relaxed">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}

      {activeTab === 'rag' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Store Context Card */}
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm lg:col-span-5 space-y-4">
              <div className="border-b border-orange-50 pb-3 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-800">Index Knowledge Context</h3>
              </div>
              
              <form onSubmit={handleStoreRagContext} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Context Source
                  </label>
                  <select
                    value={ragSource}
                    onChange={(e) => setRagSource(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none transition bg-white text-slate-700 font-semibold"
                  >
                    <option value="Policy">Corporate Policy</option>
                    <option value="MITRE">MITRE ATT&CK Matrix</option>
                    <option value="CVE">Vulnerability (CVE Catalog)</option>
                    <option value="KEV">Known Exploited (KEV)</option>
                    <option value="Asset">Asset Specifications</option>
                    <option value="Finding">Historical Findings</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Source Identifier (ID)
                  </label>
                  <input
                    type="text"
                    value={ragSourceId}
                    onChange={(e) => setRagSourceId(e.target.value)}
                    placeholder="e.g. pol-auth-02, T1190, CVE-2021-44228"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none transition bg-white text-slate-700 font-semibold"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Document Text Context
                  </label>
                  <textarea
                    value={ragContent}
                    onChange={(e) => setRagContent(e.target.value)}
                    placeholder="Enter policy details, mitre technique logs, or asset metadata content..."
                    rows="6"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none transition bg-white text-slate-700 font-semibold resize-none"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={ragStoreLoading}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50"
                >
                  {ragStoreLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Indexing document...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5 text-orange-400" />
                      <span>Index Context Document</span>
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Search Context Card */}
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm lg:col-span-7 space-y-4">
              <div className="border-b border-orange-50 pb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-slate-800">Semantic Retrieve & Similarity Search</h3>
              </div>
              
              <form onSubmit={handleSearchRagContext} className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    placeholder="Search corporate policies, KEV alerts, or assets context..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none transition bg-white text-slate-700 font-semibold"
                    required
                  />
                </div>
                
                <select
                  value={ragLimit}
                  onChange={(e) => setRagLimit(parseInt(e.target.value))}
                  className="px-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none transition bg-white text-slate-700 font-semibold"
                >
                  <option value="3">3 matches</option>
                  <option value="5">5 matches</option>
                  <option value="10">10 matches</option>
                </select>
                
                <button
                  type="submit"
                  disabled={ragLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition cursor-pointer disabled:opacity-50"
                >
                  {ragLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Query</span>
                  )}
                </button>
              </form>
              
              {/* Query Results */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Matches Ranked by Cosine Similarity
                </h4>
                
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {ragResults.length > 0 ? (
                    ragResults.map((result, idx) => (
                      <div
                        key={result.id || idx}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 hover:border-orange-200 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                              {result.source}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{result.sourceId}</span>
                          </div>
                          
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            result.score >= 0.85
                              ? 'bg-green-100 text-green-800'
                              : result.score >= 0.70
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {result.score ? `Score: ${(result.score * 100).toFixed(1)}%` : 'No score'}
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {result.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">Ready to query the knowledge database context.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Similarity searches execute real-time cosine calculations on vectors.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
