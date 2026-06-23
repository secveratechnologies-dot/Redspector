'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Plus, RefreshCw, CheckCircle2, AlertTriangle, Link2, Link2Off } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'Connected' | 'Disconnected';
  desc: string;
  iconColor: string;
}

export default function IntegrationsDashboard() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'INT-001',
      name: 'AWS Security Hub',
      type: 'Cloud Platform',
      status: 'Connected',
      desc: 'Aggregates security findings from AWS services and partner products.',
      iconColor: 'text-orange-500',
    },
    {
      id: 'INT-002',
      name: 'Okta Identity',
      type: 'IAM Provider',
      status: 'Connected',
      desc: 'Retrieves corporate directories, directory groups, and multi-factor compliance logs.',
      iconColor: 'text-blue-400',
    },
    {
      id: 'INT-003',
      name: 'PagerDuty',
      type: 'Incident Management',
      status: 'Disconnected',
      desc: 'Escalates critical vulnerability alerts directly to active DevOps pipelines.',
      iconColor: 'text-green-400',
    },
    {
      id: 'INT-004',
      name: 'Jira Software',
      type: 'Task Tracking',
      status: 'Connected',
      desc: 'Automatically queues ticket remediations and reports resolution back.',
      iconColor: 'text-sky-400',
    },
    {
      id: 'INT-005',
      name: 'Slack Messages',
      type: 'Notifications',
      status: 'Disconnected',
      desc: 'Broadcasts channel alerts when high/critical vulnerability detections trigger.',
      iconColor: 'text-pink-500',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [newIntegrationType, setNewIntegrationType] = useState('Cloud Platform');
  const [newIntegrationDesc, setNewIntegrationDesc] = useState('');

  const toggleConnection = (id: string) => {
    setIntegrations(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === 'Connected' ? 'Disconnected' : 'Connected' }
          : item
      )
    );
  };

  const handleAddIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntegrationName.trim()) return;

    const newInt: Integration = {
      id: `INT-0${integrations.length + 1}`,
      name: newIntegrationName,
      type: newIntegrationType,
      status: 'Disconnected',
      desc: newIntegrationDesc || 'No description provided.',
      iconColor: 'text-orange-400',
    };

    setIntegrations(prev => [...prev, newInt]);
    setModalOpen(false);
    setNewIntegrationName('');
    setNewIntegrationDesc('');
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Integrations</h1>
          <p className="text-slate-500 mt-1">Connect your directory, cloud posture managers, and incident pipelines.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-semibold transition cursor-pointer self-start md:self-auto shadow-lg shadow-orange-950/20"
        >
          <Plus className="w-5 h-5" />
          <span>Add Integration</span>
        </button>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <Card key={item.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.type}</span>
                    <h3 className="text-lg font-bold text-white mt-1">{item.name}</h3>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-850">
                    <Database className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mt-4">{item.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-850/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.status === 'Connected' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-400 font-semibold">Active Connection</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-400 font-semibold">Disconnected</span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => toggleConnection(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    item.status === 'Connected'
                      ? 'bg-slate-800 text-red-400 hover:bg-slate-700/80 border border-slate-700/50'
                      : 'bg-orange-600/10 text-orange-400 hover:bg-orange-600/20 border border-orange-500/20'
                  }`}
                >
                  {item.status === 'Connected' ? (
                    <>
                      <Link2Off className="w-3.5 h-3.5" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Integration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Integration</h2>
            <form onSubmit={handleAddIntegration} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Integration Name</label>
                <input
                  type="text"
                  required
                  value={newIntegrationName}
                  onChange={(e) => setNewIntegrationName(e.target.value)}
                  placeholder="e.g. GitHub Actions"
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Category / Type</label>
                <select
                  value={newIntegrationType}
                  onChange={(e) => setNewIntegrationType(e.target.value)}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                >
                  <option value="Cloud Platform">Cloud Platform</option>
                  <option value="IAM Provider">IAM Provider</option>
                  <option value="Incident Management">Incident Management</option>
                  <option value="Task Tracking">Task Tracking</option>
                  <option value="Notifications">Notifications</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Description</label>
                <textarea
                  value={newIntegrationDesc}
                  onChange={(e) => setNewIntegrationDesc(e.target.value)}
                  placeholder="Brief summary of connection purposes..."
                  rows={3}
                  className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none resize-none transition"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition font-semibold"
                >
                  Add Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
