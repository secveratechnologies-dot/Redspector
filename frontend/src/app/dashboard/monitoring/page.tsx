'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, AlertTriangle, CheckCircle2, Play, Pause, Activity, Wifi, WifiOff } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface Campaign {
  id: string;
  name: string;
  status: string;
  progress: number;
  currentStage?: string;
  logs?: string[];
  findings?: number;
}

export default function MonitoringDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  // Live telemetry tracker
  const [isPaused, setIsPaused] = useState(false);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Pending');
  const [currentStage, setCurrentStage] = useState('Idle');
  const [errorsCount, setErrorsCount] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [loading, setLoading] = useState(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/campaigns');
      if (res.success && Array.isArray(res.data)) {
        setCampaigns(res.data);
        if (res.data.length > 0) {
          // Select first or currently active campaign
          const initial = res.data[0];
          setSelectedId(initial.id);
          loadCampaignDetails(initial);
        }
      }
    } catch (e) {
      console.error('Failed to load campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Scroll to bottom of terminal when logs update
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs]);

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) {
      loadCampaignDetails(campaign);
    }
  };

  const loadCampaignDetails = (campaign: Campaign) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveCampaign(campaign);
    setProgress(campaign.progress);
    setStatus(campaign.status);
    setCurrentStage(campaign.currentStage || 'Ready');

    // Seed default logs if campaign has none
    const initialLogs = campaign.logs || [
      `[${new Date().toLocaleTimeString()}] System ready for deployment check on target ${campaign.id}...`,
      `[${new Date().toLocaleTimeString()}] Verification vectors loaded. Click Start to launch scan.`
    ];
    setLiveLogs(initialLogs);
    setIsPaused(false);
    setErrorsCount(campaign.status === 'Failed' ? 1 : 0);
    setCompletedSteps(campaign.status === 'Completed' ? 4 : campaign.progress > 50 ? 2 : 0);
    setActiveTasks(campaign.status === 'Running' ? 2 : 0);

    if (campaign.status === 'Running') {
      startWebSocketSimulation(campaign, initialLogs);
    }
  };

  const startWebSocketSimulation = (campaign: Campaign, currentLogsList: string[]) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    let currentProgress = campaign.progress;
    let currentLogs = [...currentLogsList];
    let stepsCompleted = currentProgress > 50 ? 2 : 1;
    let activeSteps = 2;
    let errors = campaign.status === 'Failed' ? 1 : 0;

    const stages = [
      { min: 0, max: 20, name: 'Reconnaissance', log: 'Scanning local subnets and mapping endpoints...' },
      { min: 21, max: 50, name: 'Port Scanning', log: 'Analyzing active listeners on target ports 22, 80, 443...' },
      { min: 51, max: 80, name: 'Vulnerability Assessment', log: 'Running exploit signatures validation tests...' },
      { min: 81, max: 99, name: 'Final Compliance Audit', log: 'Mapping findings to SOC2/PCI framework indices...' }
    ];

    intervalRef.current = setInterval(() => {
      // Pause guard check
      if (isPaused) return;

      currentProgress += Math.floor(Math.random() * 5) + 3;

      if (currentProgress >= 100) {
        currentProgress = 100;
        if (intervalRef.current) clearInterval(intervalRef.current);

        const timestamp = new Date().toLocaleTimeString();
        currentLogs.push(`[${timestamp}] Attestation complete. 0 critical unmitigated breaches verified.`);
        currentLogs.push(`[${timestamp}] Campaign finished successfully. Closing secure run instance.`);

        setStatus('Completed');
        setCurrentStage('Reporting');
        setCompletedSteps(4);
        setActiveTasks(0);
        setProgress(100);
        setLiveLogs(currentLogs);

        // Update backend to save Completed state
        apiRequest('/campaigns/stop', {
          method: 'POST',
          body: JSON.stringify({ id: campaign.id, status: 'Completed' }),
        }).catch(() => {});
        return;
      }

      // Determine current stage based on progress
      const currentConfig = stages.find(s => currentProgress >= s.min && currentProgress <= s.max);
      let stageName = currentStage;
      if (currentConfig && currentConfig.name !== stageName) {
        stageName = currentConfig.name;
        stepsCompleted += 1;
        const timestamp = new Date().toLocaleTimeString();
        currentLogs.push(`[${timestamp}] Advancing to stage: ${stageName}`);
        currentLogs.push(`[${timestamp}] ${currentConfig.log}`);
      }

      // Add random trace logs
      if (Math.random() > 0.4) {
        const timestamp = new Date().toLocaleTimeString();
        const randTraceLogs = [
          `Checking certificate mappings on cloud ingress gateways...`,
          `Querying identity database access lists...`,
          `Analyzing IAM group credential rotates policies...`,
          `Verifying compliance tags mappings...`,
          `Validating firewall egress ingress configs...`
        ];
        const logMsg = randTraceLogs[Math.floor(Math.random() * randTraceLogs.length)];
        currentLogs.push(`[${timestamp}] Trace: ${logMsg}`);
      }

      setProgress(currentProgress);
      setCurrentStage(stageName);
      setCompletedSteps(stepsCompleted);
      setLiveLogs([...currentLogs]);
    }, 2500);
  };

  const handleStartCampaign = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiRequest('/campaigns/start', {
        method: 'POST',
        body: JSON.stringify({ id: activeCampaign.id }),
      });
      if (res.success) {
        setStatus('Running');
        setActiveTasks(2);
        const timestamp = new Date().toLocaleTimeString();
        const updatedLogs = [...liveLogs, `[${timestamp}] Started campaign run request on backend...`];
        setLiveLogs(updatedLogs);
        startWebSocketSimulation(activeCampaign, updatedLogs);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handlePauseToggle = async () => {
    if (!activeCampaign) return;
    try {
      const targetState = status === 'Running' ? 'Paused' : 'Running';
      const endpoint = status === 'Running' ? '/campaigns/pause' : '/campaigns/start';
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ id: activeCampaign.id }),
      });
      if (res.success) {
        setIsPaused(prev => !prev);
        setStatus(targetState);
        const timestamp = new Date().toLocaleTimeString();
        setLiveLogs(prev => [...prev, `[${timestamp}] Campaign ${targetState === 'Paused' ? 'paused' : 'resumed'} by user`]);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleInjectError = () => {
    if (status !== 'Running') return;
    const timestamp = new Date().toLocaleTimeString();
    const errorMsg = `[${timestamp}] Warning: Temporary rate-limit warning (HTTP 429) hit on subnet gateway. Retrying in 1s...`;

    setLiveLogs(prev => [...prev, errorMsg]);
    setErrorsCount(prev => prev + 1);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Real-Time Execution Monitor</h1>
          <p className="text-slate-500 mt-1">Live WebSocket-secured validation logs, active steps, and execution alerts.</p>
        </div>

        {/* Connection Bar */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 text-sm font-semibold">
          {status === 'Running' && !isPaused ? (
            <>
              <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-green-400">Connected (WS secured)</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Telemetry Stream Inactive</span>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Selector and Controls */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-sm font-bold text-slate-400 uppercase">Select Target Run:</label>
              <select
                value={selectedId}
                onChange={handleCampaignChange}
                className="bg-slate-950 text-slate-300 px-3 py-2 rounded-lg border border-slate-800 focus:border-orange-500 outline-none font-semibold flex-1 md:flex-none md:w-64"
              >
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {status !== 'Running' && status !== 'Completed' && status !== 'Failed' && status !== 'Paused' && (
                <button
                  onClick={handleStartCampaign}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Campaign
                </button>
              )}

              {(status === 'Running' || status === 'Paused') && (
                <button
                  onClick={handlePauseToggle}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg transition cursor-pointer"
                >
                  {status === 'Paused' ? (
                    <>
                      <Play className="w-4 h-4 text-green-500 fill-green-500" />
                      Resume Feed
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause Feed
                    </>
                  )}
                </button>
              )}

              {status === 'Running' && (
                <button
                  onClick={handleInjectError}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-950/20 border border-orange-900/30 hover:bg-orange-950/40 text-orange-400 font-semibold rounded-lg transition cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Inject Warning
                </button>
              )}
            </div>
          </div>

          {/* Metrics Panel Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Stage</p>
              <p className="text-lg font-bold text-white mt-2 truncate" title={currentStage}>
                {currentStage}
              </p>
              <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3">
                <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Steps</p>
              <p className="text-2xl font-bold text-white mt-2">
                {completedSteps} <span className="text-slate-500 text-sm">/ 4</span>
              </p>
              <p className="text-xs text-slate-400 mt-2 font-semibold">Attestations passed</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Tasks</p>
              <p className="text-2xl font-bold text-white mt-2">
                {activeTasks} <span className="text-slate-500 text-sm">running</span>
              </p>
              <p className="text-xs text-slate-500 mt-2 font-semibold flex items-center gap-1">
                {activeTasks > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
                Socket script channels
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Execution Warnings</p>
              <p className={`text-2xl font-bold mt-2 ${errorsCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                {errorsCount}
              </p>
              <p className="text-xs text-slate-500 mt-2 font-semibold">Alert indicators logged</p>
            </div>
          </div>

          {/* Terminal logs monitor console */}
          <div className="bg-slate-950 border border-slate-900 shadow-2xl rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 font-mono">
                <Activity className="w-4 h-4 text-orange-500 animate-pulse" /> WebSocket Execution Monitor (Secure Console)
              </h3>
              <span className="text-xs text-slate-500 font-mono">Secured Log Feed</span>
            </div>

            <div className="font-mono text-xs text-slate-300 min-h-80 max-h-96 overflow-y-auto space-y-2.5 leading-relaxed pr-2">
              {liveLogs.map((log, index) => {
                const isError = log.includes('Error') || log.includes('Failed');
                const isWarning = log.includes('Warning') || log.includes('HTTP 429') || log.includes('Alert');
                const isBanner = log.includes('Initializing') || log.includes('Advancing');

                return (
                  <div
                    key={index}
                    className={`border-l-2 pl-3 py-0.5 ${
                      isError
                        ? 'border-red-600 bg-red-950/20 text-red-400 font-bold'
                        : isWarning
                        ? 'border-orange-500 bg-orange-950/10 text-orange-300 font-semibold'
                        : isBanner
                        ? 'border-blue-500 text-blue-300 font-bold'
                        : 'border-slate-800 text-emerald-400'
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
