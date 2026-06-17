import React from 'react';
import { Award, Download, ShieldCheck, Calendar, ShieldAlert } from 'lucide-react';
import Badge from '../components/Badge';

export default function Deliverables({ onNotify }) {
  const deliverables = [
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

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Award className="w-8 h-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-slate-800">Compliance & Audit Deliverables</h1>
      </div>

      {/* Grid of Deliverables Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deliverables.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-orange-100 p-6 flex flex-col justify-between shadow-sm hover:border-orange-300 transition-all hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.type}</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-0.5">{item.title}</h3>
                </div>
                <div className="ml-3">
                  <Badge variant={item.status === 'Verified' ? 'green' : 'red'} label={item.status} />
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">{item.description}</p>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Expires: {item.expiry}</span>
                {item.status === 'Expiring Soon' && (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                )}
              </div>
              <button
                onClick={() => onNotify(`Downloading deliverable package ${item.id}...`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Get PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
