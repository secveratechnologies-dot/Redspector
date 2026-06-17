import React from 'react';
import { Database, Plus } from 'lucide-react';
import Badge from '../components/Badge';

const Integrations = () => {
  const integrations = [
    {
      id: 'INT-001',
      name: 'AWS Security Hub',
      type: 'Cloud Platform',
      status: 'Connected',
    },
    {
      id: 'INT-002',
      name: 'Okta Identity',
      type: 'IAM Provider',
      status: 'Connected',
    },
    {
      id: 'INT-003',
      name: 'PagerDuty',
      type: 'Incident Management',
      status: 'Disconnected',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-orange-50 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-slate-800">Integrations</h3>
        <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20">
          <Plus className="w-4 h-4" />
          <span>Add Integration</span>
        </button>
      </div>

      {/* Table */}
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
          <tr>
            <th className="p-4 font-semibold">ID</th>
            <th className="p-4 font-semibold">Name</th>
            <th className="p-4 font-semibold">Type</th>
            <th className="p-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {integrations.map((integration) => (
            <tr
              key={integration.id}
              className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
            >
              <td className="p-4 font-mono text-blue-600">{integration.id}</td>
              <td className="p-4 font-medium text-slate-900">{integration.name}</td>
              <td className="p-4 text-slate-700">{integration.type}</td>
              <td className="p-4">
                <Badge color={integration.status === 'Connected' ? 'green' : 'red'}>
                  {integration.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Integrations;
