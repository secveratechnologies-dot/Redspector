import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, AlertTriangle, CheckCircle2, Play, Pause, Activity, Wifi, WifiOff } from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function Monitoring({ onNotify }) {
  const { fetchCampaigns, updateCampaignProgress } = useAPI();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [activeCampaign, setActiveCampaign] = useState(null);
  
  // Real-time telemetry simulation state
  const [isPaused, setIsPaused] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Pending');
  const [currentStage, setCurrentStage] = useState('Idle');
  const [errorsCount, setErrorsCount] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  
  const terminalEndRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadCampaigns();
    return () => clearInterval(intervalRef.current);
  }, []);

  // Scroll to bottom of terminal when logs update
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs]);

  // Load campaigns list and pick first active one if possible
  const loadCampaigns = async () => {
    const result = await fetchCampaigns();
    if (result.success && result.data.length > 0) {
      setCampaigns(result.data);
      // Auto select the first campaign
      setSelectedId(result.data[0].id);
      loadCampaignDetails(result.data[0]);
    }
  };

  const handleCampaignChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) {
      loadCampaignDetails(campaign);
    }
  };

  const loadCampaignDetails = (campaign) => {
    clearInterval(intervalRef.current);
    setActiveCampaign(campaign);
    setProgress(campaign.progress);
    setStatus(campaign.status);
    setCurrentStage(campaign.currentStage);
    setLiveLogs(campaign.logs || []);
    setIsPaused(false);
    setErrorsCount(campaign.status === 'Failed' ? 1 : 0);
    setCompletedSteps(campaign.status === 'Completed' ? 4 : campaign.progress > 50 ? 2 : 0);
    setActiveTasks(campaign.status === 'Running' ? 2 : 0);

    // If campaign is Running, launch the WebSocket simulator
    if (campaign.status === 'Running') {
      startWebSocketSimulation(campaign);
    }
  };

  const startWebSocketSimulation = (campaign) => {
    clearInterval(intervalRef.current);
    
    // Set up local tracking variables
    let currentProgress = campaign.progress;
    let currentLogs = [...campaign.logs];
    let stepsCompleted = campaign.progress > 50 ? 2 : 1;
    let activeSteps = 2;
    let errors = 0;

    const stages = [
      { min: 0, max: 20, name: 'Reconnaissance', log: 'Scanning local subnets and mapping endpoints...' },
      { min: 21, max: 50, name: 'Port Scanning', log: 'Analyzing active listeners on target ports 22, 80, 443...' },
      { min: 51, max: 80, name: 'Vulnerability Assessment', log: 'Running exploit signatures validation tests...' },
      { min: 81, max: 99, name: 'Final Compliance Audit', log: 'Mapping findings to SOC2/PCI framework indices...' }
    ];

    intervalRef.current = setInterval(() => {
      if (isPaused) return;

      // Increment progress
      currentProgress += Math.floor(Math.random() * 5) + 3;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(intervalRef.current);
        
        const timestamp = new Date().toLocaleTimeString();
        currentLogs.push(`[${timestamp}] Attestation complete. 0 critical unmitigated breaches verified.`);
        currentLogs.push(`[${timestamp}] Campaign finished successfully. Closing secure run instance.`);
        
        setStatus('Completed');
        setCurrentStage('Reporting');
        setCompletedSteps(4);
        setActiveTasks(0);
        setProgress(100);
        setLiveLogs(currentLogs);

        // Update database
        updateCampaignProgress(campaign.id, {
          progress: 100,
          status: 'Completed',
          currentStage: 'Reporting',
          logs: currentLogs
        });
        
        onNotify('Campaign validation run completed!');
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

      // Add a random informational execution trace log
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

      // Write changes to API database
      updateCampaignProgress(campaign.id, {
        progress: currentProgress,
        status: 'Running',
        currentStage: stageName,
        logs: currentLogs
      });

    }, 2500);
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    onNotify(isPaused ? 'Resuming telemetry feed' : 'Telemetry feed paused');
  };

  const handleInjectError = () => {
    if (status !== 'Running') {
      onNotify('Simulated warnings can only be injected during active runs');
      return;
    }
    const timestamp = new Date().toLocaleTimeString();
    const errorMsg = `[${timestamp}] Warning: Temporary rate-limit warning (HTTP 429) hit on subnet gateway. Retrying in 1s...`;
    
    setLiveLogs(prev => [...prev, errorMsg]);
    setErrorsCount(prev => prev + 1);
    onNotify('Warning injected successfully');
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Real-Time Execution Monitor</h1>
          <p className="text-slate-500 mt-1">Live WebSocket-secured validation logs, active steps, and execution alerts.</p>
        </div>

        {/* Connection Bar */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-lg border border-orange-100 shadow-sm text-sm font-semibold">
          {status === 'Running' && !isPaused ? (
            <>
              <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-green-700">Connected (WS secured)</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">Telemetry Stream Inactive</span>
            </>
          )}
        </div>
      </div>

      {/* Selector and Controls */}
      <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-sm font-bold text-slate-500 uppercase">Select Target Run:</label>
          <select
            value={selectedId}
            onChange={handleCampaignChange}
            className="bg-slate-50 text-slate-800 px-3 py-2 rounded-lg border border-orange-100 focus:border-orange-500 outline-none font-semibold flex-1 md:flex-none md:w-64"
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.id} - {c.name} ({c.status})
              </option>
            ))}
          </select>
        </div>

        {status === 'Running' && (
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handlePauseToggle}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 text-green-600" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume Feed' : 'Pause Feed'}
            </button>
            <button
              onClick={handleInjectError}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 hover:bg-orange-100/60 text-orange-700 font-semibold rounded-lg transition cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              Inject Test Warning
            </button>
          </div>
        )}
      </div>

      {/* Metrics Panel Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Stage</p>
          <p className="text-lg font-bold text-slate-800 mt-2 truncate" title={currentStage}>
            {currentStage}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Steps</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {completedSteps} <span className="text-slate-400 text-sm">/ 4</span>
          </p>
          <p className="text-xs text-slate-400 mt-2 font-semibold">Attestations passed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tasks</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            {activeTasks} <span className="text-slate-400 text-sm">running</span>
          </p>
          <p className="text-xs text-slate-400 mt-2 font-semibold flex items-center gap-1">
            {activeTasks > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
            Socket script channels
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Execution Warnings</p>
          <p className={`text-2xl font-bold mt-2 ${errorsCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
            {errorsCount}
          </p>
          <p className="text-xs text-slate-400 mt-2 font-semibold">Alert indicators logged</p>
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
    </div>
  );
}
