import React, { useState, useEffect } from 'react';
import { Settings, Building, Shield, Globe, Palette, Save } from 'lucide-react';
import { useAPI } from '../hooks/useAPI';

export default function TenantSettings({ onNotify }) {
  const { loading, fetchTenantSettings, updateTenantSettings } = useAPI();
  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
    contactEmail: '',
    defaultRole: 'Analyst',
    mfaRequirement: 'Enforced',
    sessionTimeout: '30m',
    ipWhitelist: '',
    brandingColor: 'orange',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await fetchTenantSettings();
    if (result.success && result.data) {
      setFormData(result.data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorSelect = (color) => {
    setFormData((prev) => ({
      ...prev,
      brandingColor: color,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateTenantSettings(formData);
    if (result.success) {
      onNotify('Tenant settings updated successfully');
    } else {
      onNotify('Failed to update tenant settings');
    }
  };

  const roles = ['Admin', 'Security Manager', 'Analyst', 'Viewer'];
  const mfaPolicies = ['Enforced', 'Optional'];
  const timeouts = [
    { label: '15 Minutes', value: '15m' },
    { label: '30 Minutes', value: '30m' },
    { label: '1 Hour', value: '1h' },
    { label: '4 Hours', value: '4h' },
    { label: '8 Hours', value: '8h' },
  ];
  const accentColors = [
    { name: 'orange', class: 'bg-orange-500 ring-orange-500' },
    { name: 'indigo', class: 'bg-indigo-500 ring-indigo-500' },
    { name: 'emerald', class: 'bg-emerald-500 ring-emerald-500' },
    { name: 'blue', class: 'bg-blue-500 ring-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Tenant Settings</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Tenant Profile */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Building className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Tenant Profile</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company / Tenant Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                  placeholder="e.g. Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Primary Domain
                </label>
                <input
                  type="text"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                  placeholder="e.g. acme.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Technical Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                  placeholder="e.g. admin@acme.com"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Security & Authentication */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Shield className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">
                Security & Authentication
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Default User Role
                </label>
                <select
                  name="defaultRole"
                  value={formData.defaultRole}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned automatically to newly registered users
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  MFA Policy
                </label>
                <select
                  name="mfaRequirement"
                  value={formData.mfaRequirement}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                >
                  {mfaPolicies.map((policy) => (
                    <option key={policy} value={policy}>
                      {policy}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Session Timeout
                </label>
                <select
                  name="sessionTimeout"
                  value={formData.sessionTimeout}
                  onChange={handleChange}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none"
                >
                  {timeouts.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Network Settings */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Globe className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Network Whitelist</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Allowed IP Ranges / Addresses
                </label>
                <textarea
                  name="ipWhitelist"
                  value={formData.ipWhitelist}
                  onChange={handleChange}
                  rows="4"
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-orange-500 outline-none resize-none font-mono text-sm"
                  placeholder="e.g. 192.168.1.0/24, 10.0.0.0/8"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Separate multiple IP addresses or CIDR blocks with commas
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Branding Settings */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Palette className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-white">Branding Accent Color</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-4">
                  Theme Accent Color
                </label>
                <div className="flex items-center gap-4">
                  {accentColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleColorSelect(color.name)}
                      className={`w-12 h-12 rounded-full cursor-pointer transition ${color.class} ${
                        formData.brandingColor === color.name
                          ? 'ring-4 ring-offset-4 ring-offset-slate-800 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={`${color.name} theme`}
                    />
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white capitalize">
                      {formData.brandingColor} Accent Active
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Preview of active component styling
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold uppercase ${
                      formData.brandingColor === 'orange'
                        ? 'bg-orange-600 text-white'
                        : formData.brandingColor === 'indigo'
                        ? 'bg-indigo-600 text-white'
                        : formData.brandingColor === 'emerald'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    Button Preview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg shadow-lg hover:shadow-orange-900/10 transition cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving Changes...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
