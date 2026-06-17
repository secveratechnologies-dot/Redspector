import React, { useState, useEffect } from 'react';
import {
  LogOut,
  User,
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Menu,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const AuthLayout = ({
  children,
  user,
  onLogout,
  activePage,
  onPageChange,
  notifications = [],
  markAsRead,
  markAllAsRead,
  clearNotifications,
}) => {
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifCenter(false);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen bg-orange-50 font-sans text-slate-900">
      {/* Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={onPageChange}
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Enhanced Header with Notification Center */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-orange-100 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-orange-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activePage}</h2>
          </div>
          
          <div className="flex items-center gap-5">
            {/* Notification Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifCenter(!showNotifCenter)}
                className="p-2 text-slate-400 hover:text-orange-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer relative focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
                title="View Notifications"
                aria-haspopup="true"
                aria-expanded={showNotifCenter}
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown Popover */}
              {showNotifCenter && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl border border-orange-100 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[420px] animate-in">
                  {/* Header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-orange-50 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-orange-500" /> Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          if (markAllAsRead) markAllAsRead();
                        }}
                        className="text-[10px] text-orange-600 hover:text-orange-800 font-bold flex items-center gap-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none rounded"
                        aria-label="Mark all notifications as read"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List Items */}
                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1 max-h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                        You have no notifications.
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const borderColors = {
                          critical: 'border-l-red-500 bg-red-50/5',
                          warning: 'border-l-orange-500 bg-orange-50/5',
                          info: 'border-l-blue-500 bg-blue-50/5',
                        };
                        const icons = {
                          critical: ShieldAlert,
                          warning: AlertTriangle,
                          info: Info,
                        };
                        const NotifIcon = icons[notif.type] || Info;

                        return (
                          <div
                            key={notif.id}
                            className={`p-3.5 border-l-4 transition-all flex gap-3 items-start ${
                              borderColors[notif.type] || 'border-l-slate-300'
                            } ${!notif.read ? 'bg-orange-50/10' : 'bg-white opacity-70'}`}
                          >
                            <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0 mt-0.5">
                              <NotifIcon
                                className={`w-3.5 h-3.5 ${
                                  notif.type === 'critical'
                                    ? 'text-red-500'
                                    : notif.type === 'warning'
                                    ? 'text-orange-500'
                                    : 'text-blue-500'
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className={`text-xs font-bold leading-tight ${!notif.read ? 'text-slate-800' : 'text-slate-500'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <button
                                    onClick={() => {
                                      if (markAsRead) markAsRead(notif.id);
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-green-600 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none rounded"
                                    title="Mark as read"
                                    aria-label={`Mark notification "${notif.title}" as read`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed break-words">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-slate-400 font-semibold mt-1.5 block">
                                {notif.time}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                      <button
                                                        onClick={() => {
                          if (clearNotifications) clearNotifications();
                        }}
                        className="text-[10px] text-slate-400 hover:text-red-600 font-bold flex items-center justify-center gap-1 w-full cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none rounded"
                        aria-label="Clear all notifications"
                      >
                        <Trash2 className="w-3 h-3" /> Clear all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user?.fullName || 'User'}</p>
                <p className="text-xs text-slate-400 font-semibold">{user?.companyName || 'Company'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-extrabold shadow-md">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus:outline-none"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
};

export default AuthLayout;
