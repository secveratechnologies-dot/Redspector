'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Download, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Deliverable {
  id: string;
  title: string;
  description: string;
  expiry: string;
  status: 'Verified' | 'Expiring Soon';
  type: string;
}

export default function DeliverablesDashboard() {
  const deliverables: Deliverable[] = [
    {
      id: 'D-SOC2-2026',
      title: 'SOC 2 Type II Compliance Report Package',
      description: 'Audit evaluation detailing security policies, availability, and privacy confidentiality controls.',
      expiry: '2027-06-30',
      status: 'Verified',
      type: 'Attestation Package',
    },
    {
      id: 'D-ISO-27001',
      title: 'ISO/IEC 27001 Certification attestation',
      description: 'Global standard certification for managing information security controls and framework policies.',
      expiry: '2027-05-12',
      status: 'Verified',
      type: 'Official Certificate',
    },
    {
      id: 'D-PENTEST-2026',
      title: 'External Network & Application Penetration Testing Report',
      description: 'Detailed analysis of red-teaming scans, exploit findings, and remediation verification.',
      expiry: '2026-12-15',
      status: 'Expiring Soon',
      type: 'Audit Assessment',
    },
    {
      id: 'D-HIPAA-SELF',
      title: 'HIPAA Security Rule Compliance Scoping Assessment',
      description: 'Self-assessment evaluation checklist mapping controls for protecting health identifiers.',
      expiry: '2027-03-01',
      status: 'Verified',
      type: 'Assessment Form',
    },
  ];

  const [notification, setNotification] = useState('');

  const triggerDownload = (id: string) => {
    setNotification(`Initiating download for package: ${id}...`);
    setTimeout(() => {
      setNotification('');
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Compliance & Audit Deliverables</h1>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm animate-pulse">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid of Deliverables Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deliverables.map((item) => (
          <Card
            key={item.id}
            className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all flex flex-col justify-between"
          >
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.type}</span>
                    <h3 className="text-lg font-bold text-white mt-1">{item.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === 'Verified' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mt-4">{item.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Expires: {item.expiry}</span>
                  {item.status === 'Expiring Soon' && (
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  )}
                </div>
                <button
                  onClick={() => triggerDownload(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-lg text-xs font-bold transition cursor-pointer border border-orange-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Get PDF
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
