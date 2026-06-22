'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
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
  Menu, 
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';

/**
 * Root wrapper layout for the authenticated dashboard pages.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const role = (user?.role || 'admin').toLowerCase();

  const securityItems = [
    { id: 'dashboard', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'campaigns', href: '/dashboard/campaigns', icon: Play, label: 'Campaigns' },
    { id: 'assets', href: '/dashboard/assets', icon: Server, label: 'Assets' },
    { id: 'findings', href: '/dashboard/findings', icon: ShieldAlert, label: 'Findings' },
    { id: 'risk', href: '/dashboard/risk', icon: Gauge, label: 'Risk Intelligence' },
    { id: 'ai-insights', href: '/dashboard/ai-insights', icon: Sparkles, label: 'AI Insights' },
    { id: 'integrations', href: '/dashboard/integrations', icon: Database, label: 'Integrations' },
    { id: 'monitoring', href: '/dashboard/monitoring', icon: Terminal, label: 'Live Monitor' },
  ];

  const adminItems = [
    { id: 'users', href: '/dashboard/users', icon: Users, label: 'Users' },
    { id: 'roles', href: '/dashboard/roles', icon: Shield, label: 'Roles' },
    { id: 'permissions', href: '/dashboard/permissions', icon: Lock, label: 'Permissions' },
    { id: 'tenant-settings', href: '/dashboard/tenant-settings', icon: Settings, label: 'Tenant Settings' },
  ];

  const executiveItems = [
    { id: 'executive-dashboard', href: '/dashboard/executive-dashboard', icon: LayoutDashboard, label: 'Exec Dashboard' },
    { id: 'reports', href: '/dashboard/reports', icon: ClipboardList, label: 'Reports' },
    { id: 'analytics', href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'deliverables', href: '/dashboard/deliverables', icon: Award, label: 'Deliverables' },
  ];

  const showAdmin = role === 'admin' || role === 'security manager';
  const showExecutive = role === 'executive' || role === 'admin';

  const renderNavList = (items: typeof securityItems) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 w-full p-2.5 rounded-lg transition-all text-sm cursor-pointer ${
              isActive
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20 font-medium'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
        
        {/* Sidebar */}
        <aside
          className={`w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col shadow-2xl overflow-y-auto transition-transform duration-300 z-40 fixed inset-y-0 left-0 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo and close btn */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-orange-500" />
              <span className="text-xl font-bold tracking-tight text-white">RedSpecter</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-6 flex-1">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                Security Ops
              </h3>
              {renderNavList(securityItems)}
            </div>

            {showExecutive && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                  Executive Portal
                </h3>
                {renderNavList(executiveItems)}
              </div>
            )}

            {showAdmin && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                  Administration
                </h3>
                {renderNavList(adminItems)}
              </div>
            )}
          </nav>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Header */}
          <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Header Empty Search Space (Aligned Right) */}
            <div className="flex-1"></div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white shadow-md">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-sm">
                  <p className="font-semibold text-white leading-tight">{user?.fullName}</p>
                  <p className="text-xs text-slate-400">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main Dashboard Screen View */}
          <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
            {children}
          </main>
        </div>

      </div>
    </ProtectedRoute>
  );
}
