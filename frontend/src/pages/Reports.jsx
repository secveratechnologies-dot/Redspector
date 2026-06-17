import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Printer,
  FileCode,
  Table,
  CheckCircle,
  Shield,
  HelpCircle,
} from 'lucide-react';
import Badge from '../components/Badge';
import { useAPI } from '../hooks/useAPI';

export default function Reports({ onNotify }) {
  const { fetchFindings, fetchAssets, fetchRiskSummary } = useAPI();

  const [findings, setFindings] = useState([]);
  const [assets, setAssets] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Wizard States
  const [selectedType, setSelectedType] = useState('executive'); // 'executive', 'technical', 'risk'
  const [selectedScope, setSelectedScope] = useState('all'); // 'all', 'critical'
  const [selectedFormat, setSelectedFormat] = useState('pdf'); // 'pdf', 'csv', 'json'
  const [generating, setGenerating] = useState(false);

  // History list of generated reports
  const [reports, setReports] = useState([
    { id: 'R-2026-004', name: 'Q2 SOC 2 Compliance Verification', date: '2026-06-01', size: '2.4 MB', type: 'SOC 2', status: 'Ready' },
    { id: 'R-2026-003', name: 'ISO 27001 Internal Scoping Report', date: '2026-05-15', size: '1.8 MB', type: 'ISO 27001', status: 'Ready' },
    { id: 'R-2026-002', name: 'Annual Penetration Testing Attestation', date: '2026-04-10', size: '4.1 MB', type: 'Pen Test', status: 'Ready' },
    { id: 'R-2026-001', name: 'PCI Scope & Compliance Attestation v4.0', date: '2026-03-01', size: '3.2 MB', type: 'PCI-DSS', status: 'Ready' },
  ]);

  // Print Preview Modal States
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    loadAllMetrics();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowPrintPreview(false);
      }
    };
    if (showPrintPreview) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPrintPreview]);

  const loadAllMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const [findingsRes, assetsRes, riskRes] = await Promise.all([
        fetchFindings(),
        fetchAssets(),
        fetchRiskSummary(),
      ]);

      if (findingsRes.success) setFindings(findingsRes.data);
      if (assetsRes.success) setAssets(assetsRes.data);
      if (riskRes.success) {
        setRiskScore(riskRes.data.riskScore);
        setRiskLevel(riskRes.data.riskLevel);
      }
    } catch (err) {
      if (onNotify) onNotify('Failed to query attestation metrics');
    } finally {
      setLoadingMetrics(false);
    }
  };

  // CSV Generator Helper
  const triggerCSVDownload = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Generator Helper
  const triggerJSONDownload = (jsonObject, filename) => {
    const blob = new Blob([JSON.stringify(jsonObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = () => {
    setGenerating(true);
    if (onNotify) {
      onNotify(`Initializing ${selectedType} report compilation...`);
    }

    setTimeout(() => {
      // 1. Filter metrics based on scope selection
      const filteredFindings = findings.filter(
        (f) => selectedScope === 'all' || f.severity === 'Critical' || f.severity === 'High'
      );
      const filteredAssets = assets.filter((a) => selectedScope === 'all' || a.critical || a.risk === 'High');

      const timestamp = new Date().toLocaleString();
      const timestampIso = new Date().toISOString().split('T')[0];
      const filenameBase = `${selectedType}_report_${selectedScope}_scope_${Date.now()}`;

      // Create record for history list
      const reportNameMap = {
        executive: 'Executive Security Posture Report',
        technical: 'Technical Vulnerability Log Report',
        risk: 'Risk Intelligence Matrix Attestation',
      };

      const newHistoryReport = {
        id: `R-2026-00${reports.length + 1}`,
        name: `${reportNameMap[selectedType]} (${selectedScope === 'all' ? 'Full Scope' : 'Critical Scope'})`,
        date: timestampIso,
        size: selectedFormat === 'json' ? '12.4 KB' : selectedFormat === 'csv' ? '3.8 KB' : '1.5 MB',
        type: selectedFormat.toUpperCase(),
        status: 'Ready',
      };

      // 2. Perform export formatting
      if (selectedFormat === 'json') {
        const jsonOutput = {
          reportTitle: reportNameMap[selectedType],
          generatedAt: timestamp,
          scope: selectedScope,
          summary: {
            overallRiskScore: riskScore,
            riskGrade: riskLevel,
            totalAssetsCount: filteredAssets.length,
            vulnerabilitiesCount: filteredFindings.length,
          },
          assets: filteredAssets,
          vulnerabilities: filteredFindings,
        };
        triggerJSONDownload(jsonOutput, `${filenameBase}.json`);
      } else if (selectedFormat === 'csv') {
        let csvContent = '';
        if (selectedType === 'technical') {
          // Columns: ID, Title, Severity, Asset, Status, Owner
          csvContent += 'Vulnerability ID,Finding Name,Severity,Asset,Status,Owner\n';
          filteredFindings.forEach((f) => {
            csvContent += `"${f.id}","${f.title}","${f.severity}","${f.asset}","${f.status}","${f.owner}"\n`;
          });
        } else if (selectedType === 'risk') {
          // Columns: Category, Score, Level
          csvContent += 'Risk Category,Exposure Score,Severity Level\n';
          filteredAssets.forEach((a) => {
            csvContent += `"${a.name}","${a.riskInfo?.score || 50}","${a.risk}"\n`;
          });
        } else {
          // Executive summary stats table
          csvContent += 'Metric Key,Attestation Value\n';
          csvContent += `"Overall Risk Posture Score","${riskScore}/100"\n`;
          csvContent += `"Threat Grade Assessment","${riskLevel} Risk"\n`;
          csvContent += `"Monitored Assets Count","${filteredAssets.length}"\n`;
          csvContent += `"Critical Vulnerabilities Logged","${filteredFindings.filter((f) => f.severity === 'Critical').length}"\n`;
        }
        triggerCSVDownload(csvContent, `${filenameBase}.csv`);
      } else if (selectedFormat === 'pdf') {
        // Prepare data for the Print preview Modal
        setPrintData({
          title: reportNameMap[selectedType],
          date: timestamp,
          scope: selectedScope === 'all' ? 'Full Posture Scope' : 'Critical Infrastructure Only',
          riskScore,
          riskLevel,
          totalAssets: filteredAssets.length,
          totalFindings: filteredFindings.length,
          findings: filteredFindings,
          assets: filteredAssets,
        });
        setShowPrintPreview(true);
      }

      setReports([newHistoryReport, ...reports]);
      setGenerating(false);
      if (onNotify) {
        onNotify('Report successfully generated and exported.');
      }
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-slate-800">Security & Attestation Reports</h1>
        </div>
      </div>

      {/* Grid: Config Wizard and History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Report Configuration Wizard (Left: 1 col) */}
        <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-slate-800 border-b border-orange-50 pb-2">
            Configure Exporter
          </h3>

          {/* Form parameters */}
          <div className="space-y-4">
            {/* 1. Report Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Report Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none transition bg-white text-slate-700 font-semibold"
              >
                <option value="executive">Executive Posture Overview</option>
                <option value="technical">Technical Vulnerabilities Log</option>
                <option value="risk">Risk Intelligence Matrix</option>
              </select>
            </div>

            {/* 2. Filter Scope */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter Scope
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'Full Scope' },
                  { id: 'critical', label: 'Critical / High Only' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedScope(item.id)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold transition select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none ${
                      selectedScope === item.id
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Export Format */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pdf', label: 'PDF Print', icon: Printer },
                  { id: 'csv', label: 'CSV', icon: Table },
                  { id: 'json', label: 'JSON', icon: FileCode },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedFormat(item.id)}
                      className={`px-2 py-2.5 rounded-lg border flex flex-col items-center gap-1.5 text-xs font-bold transition select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none ${
                        selectedFormat === item.id
                          ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleGenerateReport}
              disabled={generating || loadingMetrics}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs shadow-lg shadow-orange-500/10 transition cursor-pointer disabled:opacity-50 mt-4 focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Report...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate & Export Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Reports History (Right: 2 cols) */}
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-orange-50">
            <h3 className="font-bold text-lg text-slate-800">Export History Logs</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-orange-100 font-semibold">
                <tr>
                  <th className="p-4 text-xs uppercase">Report Title</th>
                  <th className="p-4 text-xs uppercase">Release Date</th>
                  <th className="p-4 text-xs uppercase">Format</th>
                  <th className="p-4 text-xs uppercase">Size</th>
                  <th className="p-4 text-center text-xs uppercase">Attestation</th>
                  <th className="p-4 text-center text-xs uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-orange-50/10 transition-colors"
                  >
                    <td className="p-4 text-slate-800 font-semibold flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div className="truncate max-w-[280px]" title={report.name}>
                        {report.name}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-mono">{report.date}</td>
                    <td className="p-4 text-xs">
                      <Badge
                        color={
                          report.type === 'PDF'
                            ? 'red'
                            : report.type === 'CSV'
                            ? 'blue'
                            : 'green'
                        }
                      >
                        {report.type}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-semibold">{report.size}</td>
                    <td className="p-4 text-xs text-slate-500 font-mono font-bold text-center">
                      {report.id}
                    </td>
                    <td className="p-4 text-center">
                      <Badge color="green">Ready</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PDF Printable Attestation Modal */}
      {showPrintPreview && printData && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white animate-in"
          onClick={() => setShowPrintPreview(false)}
        >
          <div
            className="bg-white w-full max-w-3xl shadow-2xl rounded-2xl border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full print:max-w-none print:h-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
          >
            {/* Modal Actions Bar (hidden during browser print) */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center print:hidden">
              <h3 id="report-dialog-title" className="font-bold text-white text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-orange-400" /> Print Attestation Document Preview
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow cursor-pointer transition focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
                >
                  <Printer className="w-3.5 h-3.5" /> Print/Save PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs px-3.5 py-1.5 rounded-lg cursor-pointer transition focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
                  aria-label="Close preview"
                >
                  ✕ Close Preview
                </button>
              </div>
            </div>

            {/* Document attestation card container */}
            <div className="p-12 space-y-8 print:p-6 overflow-y-auto max-h-[80vh] print:max-h-none print:overflow-visible">
              
              {/* Header Certificate Title */}
              <div className="flex justify-between items-start border-b-2 border-orange-500 pb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    REDSPECTER SECURITY
                  </h1>
                  <p className="text-xs uppercase tracking-widest font-extrabold text-orange-600 mt-1">
                    Compliance Attestation & Verification Certificate
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    CERTIFICATE ID: {reports[0]?.id || 'R-00X'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold">DATE: {printData.date}</p>
                </div>
              </div>

              {/* Certificate body text */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800">{printData.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This attestation certificate validates the security posture assessment of RedSpecter Security endpoints and cloud configurations. Scanning filters are set to <strong>{printData.scope}</strong>. Core vectors verify vulnerability indicators and compliance thresholds.
                </p>
              </div>

              {/* Key Metrics Section */}
              <div className="grid grid-cols-4 gap-4 py-4 border-y border-slate-100">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Posture</span>
                  <p className="text-2xl font-black text-orange-600 mt-1">{printData.riskScore}/100</p>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">{printData.riskLevel} Risk</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Compliance</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">SOC 2</p>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">Compliant (100%)</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Assets Scanned</span>
                  <p className="text-2xl font-black text-blue-600 mt-1">{printData.totalAssets}</p>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">Core Cloud Scopes</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Vulnerabilities</span>
                  <p className="text-2xl font-black text-red-600 mt-1">{printData.totalFindings}</p>
                  <p className="text-[9px] text-slate-500 font-bold mt-0.5">Priority Mitigations</p>
                </div>
              </div>

              {/* Attestation Table */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
                  Vulnerability Log Summary
                </h3>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold">
                      <tr>
                        <th className="p-3">ID</th>
                        <th className="p-3">Vulnerability / Asset</th>
                        <th className="p-3">Severity</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {printData.findings.slice(0, 5).map((f) => (
                        <tr key={f.id} className="text-slate-700">
                          <td className="p-3 font-mono font-bold text-blue-600">{f.id}</td>
                          <td className="p-3">
                            <div className="font-bold">{f.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{f.asset}</div>
                          </td>
                          <td className="p-3 font-bold">{f.severity}</td>
                          <td className="p-3">{f.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signature block */}
              <div className="pt-12 flex justify-between items-end border-t border-slate-100 select-none">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">CISO Digital Signature</p>
                  <p className="font-serif italic text-slate-800 text-lg mt-2">RedSpecter SecOps Planner</p>
                  <div className="h-0.5 w-48 bg-slate-200 mt-1" />
                </div>
                <div className="text-right text-[10px] text-slate-400 font-semibold leading-relaxed">
                  <p>SecOps Attestation Audit Platform</p>
                  <p>Certified Security Integration Hub</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
