import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Play,
  Server,
  ShieldAlert,
  Database,
  Users,
  Lock,
  Settings,
  ClipboardList,
  BarChart3,
  Award,
  Terminal,
  Gauge,
  Sparkles,
  X,
} from 'lucide-react';

const Sidebar = ({ activePage, onPageChange, user, isOpen, onClose }) => {
  const role = (user?.role || 'admin').toLowerCase();

  const securityItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'campaigns', icon: Play, label: 'Campaigns' },
    { id: 'assets', icon: Server, label: 'Assets' },
    { id: 'findings', icon: ShieldAlert, label: 'Findings' },
    { id: 'risk', icon: Gauge, label: 'Risk Intelligence' },
    { id: 'ai-insights', icon: Sparkles, label: 'AI Insights' },
    { id: 'integrations', icon: Database, label: 'Integrations' },
    { id: 'monitoring', icon: Terminal, label: 'Live Monitor' },
  ];

  const adminItems = [
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'roles', icon: Shield, label: 'Roles' },
    { id: 'permissions', icon: Lock, label: 'Permissions' },
    { id: 'tenant-settings', icon: Settings, label: 'Tenant Settings' },
  ];

  const executiveItems = [
    { id: 'executive-dashboard', icon: LayoutDashboard, label: 'Exec Dashboard' },
    { id: 'reports', icon: ClipboardList, label: 'Reports' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'deliverables', icon: Award, label: 'Deliverables' },
  ];

  const handlePageClick = (id) => {
    onPageChange(id);
    if (onClose) onClose();
  };

  const renderNavList = (items) => (
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handlePageClick(item.id)}
          className={`flex items-center gap-3 w-full p-2.5 rounded-lg transition-all text-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none ${
            activePage === item.id
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 font-medium'
              : 'hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );

  // Case-insensitive checks for visibility
  const showSecurity = true; // Keep original items visible for all roles
  const showAdmin = role === 'admin' || role === 'security manager';
  const showExecutive = role === 'executive' || role === 'admin';

  return (
    <nav
      className={`w-64 bg-slate-900 text-white p-6 flex flex-col shadow-2xl overflow-y-auto transition-transform duration-300 z-40 lg:z-auto lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0 fixed inset-y-0 left-0' : '-translate-x-full fixed inset-y-0 left-0 lg:flex'
      }`}
    >
      {/* Logo and close btn */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-orange-500" />
          <span className="text-xl font-bold tracking-tight text-white">
            RedSpecter
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-orange-500 outline-none"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6 flex-1">
        {/* Security Operations Group */}
        {showSecurity && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Security Ops
            </h3>
            {renderNavList(securityItems)}
          </div>
        )}

        {/* Executive Portal Group */}
        {showExecutive && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Executive Portal
            </h3>
            {renderNavList(executiveItems)}
          </div>
        )}

        {/* Administration Group */}
        {showAdmin && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
              Administration
            </h3>
            {renderNavList(adminItems)}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
