import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Badge from '../components/Badge';
import { DASHBOARD_STATS } from '../utils/constants';

const Dashboard = ({ findings }) => {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        {DASHBOARD_STATS.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm hover:border-orange-300 transition-all cursor-pointer hover:shadow-md"
          >
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Critical Recent Activity */}
      <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          Critical Recent Activity
        </h3>
        <div className="space-y-4">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="flex items-center justify-between p-4 border border-orange-50 rounded-lg bg-orange-50/20 hover:border-orange-200 transition-colors cursor-pointer hover:bg-orange-50/40"
            >
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">{finding.title}</p>
                  <p className="text-sm text-slate-500">
                    {finding.asset} • {finding.id}
                  </p>
                </div>
              </div>
              <Badge color="red">{finding.severity}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
