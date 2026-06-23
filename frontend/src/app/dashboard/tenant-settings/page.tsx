'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Settings, Building, Shield, Globe, Palette, Save, CheckCircle2 } from 'lucide-react';

interface TenantSettingsData {
  companyName: string;
  domain: string;
  contactEmail: string;
  defaultRole: string;
  mfaRequirement: 'Enforced' | 'Optional';
  sessionTimeout: string;
  ipWhitelist: string;
  brandingColor: 'orange' | 'indigo' | 'emerald' | 'blue';
}

export default function TenantSettingsDashboard() {
  const [formData, setFormData] = useState<TenantSettingsData>({
    companyName: 'RedSpecter Security',
    domain: 'redspecter.io',
    contactEmail: 'admin@redspecter.io',
    defaultRole: 'Analyst',
    mfaRequirement: 'Enforced',
    sessionTimeout: '30m',
    ipWhitelist: '192.168.1.0/24, 10.0.0.0/8',
    brandingColor: 'orange',
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification('');
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorSelect = (color: 'orange' | 'indigo' | 'emerald' | 'blue') => {
    setFormData((prev) => ({
      ...prev,
      brandingColor: color,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showNotification('Tenant settings updated successfully');
    }, 800);
  };

  const roles = ['Admin', 'Security Manager', 'Analyst', 'Viewer'];
  const mfaPolicies: ('Enforced' | 'Optional')[] = ['Enforced', 'Optional'];
  const timeouts = [
    { label: '15 Minutes', value: '15m' },
    { label: '30 Minutes', value: '30m' },
    { label: '1 Hour', value: '1h' },
    { label: '4 Hours', value: '4h' },
    { label: '8 Hours', value: '8h' },
  ];
  const accentColors = [
    { name: 'orange' as const, class: 'bg-orange-500 ring-orange-500' },
    { name: 'indigo' as const, class: 'bg-indigo-500 ring-indigo-500' },
    { name: 'emerald' as const, class: 'bg-emerald-500 ring-emerald-500' },
    { name: 'blue' as const, class: 'bg-blue-500 ring-blue-500' },
  ];

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Tenant Settings</h1>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Tenant Profile */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Building className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Tenant Profile</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Company / Tenant Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                    placeholder="e.g. Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Primary Domain
                  </label>
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                    placeholder="e.g. acme.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Technical Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                    placeholder="e.g. admin@acme.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Security & Authentication */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Shield className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Security & Authentication
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Default User Role
                  </label>
                  <select
                    name="defaultRole"
                    value={formData.defaultRole}
                    onChange={handleChange}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Assigned automatically to newly registered users
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    MFA Policy
                  </label>
                  <select
                    name="mfaRequirement"
                    value={formData.mfaRequirement}
                    onChange={handleChange}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                  >
                    {mfaPolicies.map((policy) => (
                      <option key={policy} value={policy}>
                        {policy}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Session Timeout
                  </label>
                  <select
                    name="sessionTimeout"
                    value={formData.sessionTimeout}
                    onChange={handleChange}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none transition"
                  >
                    {timeouts.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Network Settings */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Globe className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Network Whitelist</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Allowed IP Ranges / Addresses
                  </label>
                  <textarea
                    name="ipWhitelist"
                    value={formData.ipWhitelist}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-orange-500 outline-none resize-none font-mono text-sm transition"
                    placeholder="e.g. 192.168.1.0/24, 10.0.0.0/8"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Separate multiple IP addresses or CIDR blocks with commas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Branding Settings */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <Palette className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Branding Accent Color</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-4">
                    Theme Accent Color
                  </label>
                  <div className="flex items-center gap-4">
                    {accentColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => handleColorSelect(color.name)}
                        className={`w-10 h-10 rounded-full cursor-pointer transition ${color.class} ${
                          formData.brandingColor === color.name
                            ? 'ring-4 ring-offset-4 ring-offset-slate-900 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={`${color.name} theme`}
                      />
                    ))}
                  </div>
                  <div className="mt-6 p-4 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white capitalize">
                        {formData.brandingColor} Accent Active
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                        Preview of active component styling
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${
                        formData.brandingColor === 'orange'
                          ? 'bg-orange-600/10 text-orange-400 border-orange-500/20'
                          : formData.brandingColor === 'indigo'
                          ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                          : formData.brandingColor === 'emerald'
                          ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-blue-600/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      Button Preview
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg shadow-lg shadow-orange-950/20 hover:shadow-orange-950/40 transition cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving Changes...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
