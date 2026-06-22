import React, { useState, useEffect, Suspense, lazy } from 'react';
import AuthLayout from './layouts/AuthLayout';
import Notification from './components/Notification';
import { useNotification } from './hooks/useNotification';
import { useAuth } from './hooks/useAuth';
import { RefreshCw } from 'lucide-react';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_ASSETS,
  INITIAL_FINDINGS,
} from './utils/constants';

// Lazy load page-level routes
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const MFAVerification = lazy(() => import('./pages/MFAVerification'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Assets = lazy(() => import('./pages/Assets'));
const Findings = lazy(() => import('./pages/Findings'));
const RiskDashboard = lazy(() => import('./pages/RiskDashboard'));
const AIInsights = lazy(() => import('./pages/AIInsights'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Users = lazy(() => import('./pages/Users'));
const Roles = lazy(() => import('./pages/Roles'));
const Permissions = lazy(() => import('./pages/Permissions'));
const TenantSettings = lazy(() => import('./pages/TenantSettings'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Deliverables = lazy(() => import('./pages/Deliverables'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const getAllowedPages = (role = '') => {
  const roleLower = role.toLowerCase();
  switch (roleLower) {
    case 'analyst':
      return ['dashboard', 'campaigns', 'assets', 'findings', 'risk', 'ai-insights', 'integrations'];
    case 'executive':
      return ['executive-dashboard', 'reports', 'analytics', 'deliverables', 'dashboard', 'campaigns', 'assets', 'findings', 'risk', 'ai-insights', 'integrations'];
    case 'admin':
    case 'security manager':
    default:
      return [
        'users', 'roles', 'permissions', 'tenant-settings',
        'dashboard', 'campaigns', 'assets', 'findings', 'risk', 'ai-insights', 'integrations',
        'executive-dashboard', 'reports', 'analytics', 'deliverables',
        'monitoring'
      ];
  }
};

export default function App() {
  const [authPage, setAuthPage] = useState('login'); // 'login', 'signup', 'mfa', 'resetPassword'
  const [mfaEmail, setMfaEmail] = useState(''); // Email for MFA
  const [resetPasswordEmail, setResetPasswordEmail] = useState(''); // Email for reset
  const [activePage, setActivePage] = useState('dashboard');
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [findings, setFindings] = useState(INITIAL_FINDINGS);
  
  const [notifications, setNotifications] = useState([
    {
      id: 'N-1',
      title: 'Critical Finding Detected',
      message: 'Critical vulnerability F-882 (Exposed S3 Bucket with Public Write Access) detected on S3-PROD-01.',
      time: '10 minutes ago',
      type: 'critical',
      read: false
    },
    {
      id: 'N-2',
      title: 'Campaign Failed',
      message: 'Campaign External Web App Pen Test (C-2026-004) failed at exploitation stage.',
      time: '30 minutes ago',
      type: 'warning',
      read: false
    },
    {
      id: 'N-3',
      title: 'Approval Required',
      message: 'Remediation REC-01 (Enforce Global MFA Requirements) requires admin approval.',
      time: '1 hour ago',
      type: 'warning',
      read: false
    },
    {
      id: 'N-4',
      title: 'High Risk Alert',
      message: 'Risk score for api.redspecter.io has reached 78.',
      time: '2 hours ago',
      type: 'critical',
      read: true
    },
    {
      id: 'N-5',
      title: 'Campaign Started',
      message: 'Campaign AWS Production Perimeter Scan (C-2026-001) successfully initialized.',
      time: '5 hours ago',
      type: 'info',
      read: true
    }
  ]);

  const { showNotification, notifMessage, triggerNotif: rawTriggerNotif } = useNotification();

  const triggerNotif = (msg, type = 'info', title = 'System Notification') => {
    let messageText = msg;
    let notifTitle = title;
    let notifType = type;

    if (typeof msg === 'object' && msg !== null) {
      messageText = msg.message;
      notifTitle = msg.title || 'System Notification';
      notifType = msg.type || 'info';
    }

    rawTriggerNotif(messageText);

    const newNotif = {
      id: `N-${Date.now()}`,
      title: notifTitle,
      message: messageText,
      time: 'Just now',
      type: notifType,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const { user, isAuthenticated, login, signup, logout, checkAuth, checkAndRefreshToken } = useAuth();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Enforce access control and redirection based on user role
  useEffect(() => {
    if (isAuthenticated && user) {
      const allowed = getAllowedPages(user.role);
      if (!allowed.includes(activePage)) {
        setActivePage(allowed[0]);
      }
    }
  }, [isAuthenticated, user, activePage]);

  // Check token refresh periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        const isValid = checkAndRefreshToken();
        if (!isValid) {
          triggerNotif('Session expired. Please login again.');
        }
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLoginSuccess = (userData) => {
    setMfaEmail(userData.email);
    setAuthPage('mfa');
    triggerNotif('MFA code sent to your email');
  };

  const handleMFASuccess = (mfaData) => {
    const emailLower = mfaEmail.toLowerCase();
    let role = 'Admin';
    let fullName = 'Admin User';
    
    if (emailLower.includes('analyst')) {
      role = 'Analyst';
      fullName = 'Analyst User';
    } else if (emailLower.includes('executive')) {
      role = 'Executive';
      fullName = 'Executive User';
    } else if (emailLower === 'john@example.com') {
      role = 'Admin';
      fullName = 'John Doe';
    } else if (emailLower === 'jane@example.com') {
      role = 'Security Manager';
      fullName = 'Jane Smith';
    } else if (emailLower === 'mike@example.com') {
      role = 'Analyst';
      fullName = 'Mike Johnson';
    } else if (emailLower === 'tom@example.com') {
      role = 'Viewer';
      fullName = 'Tom Brown';
    }

    const fullUserData = {
      email: mfaEmail,
      fullName: fullName,
      companyName: 'RedSpecter Corp',
      role: role,
      mfaVerified: true,
      lastLogin: new Date().toISOString(),
    };
    login(fullUserData);
    triggerNotif(`Welcome back, ${mfaEmail}!`);

    // Redirect to default page for role
    const allowed = getAllowedPages(role);
    setActivePage(allowed[0]);
  };

  const handleSignupSuccess = (userData) => {
    setMfaEmail(userData.email);
    setAuthPage('mfa');
    triggerNotif('MFA code sent to your email');
  };

  const handleMFAResend = () => {
    triggerNotif('MFA code resent successfully');
  };

  const handleForgotPassword = (email) => {
    setResetPasswordEmail(email);
    setAuthPage('resetPassword');
  };

  const handleResetPasswordComplete = () => {
    setAuthPage('login');
    triggerNotif('Password reset successful. Please login with your new password.');
  };

  const handleLogout = () => {
    logout();
    setAuthPage('login');
    setActivePage('dashboard');
    triggerNotif('You have been logged out successfully.');
  };

  const handleStartCampaign = (id) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id ? { ...c, status: 'Running', progress: 15 } : c
      )
    );
    const campaign = campaigns.find((c) => c.id === id);
    triggerNotif({
      title: 'Campaign Started',
      message: `Campaign ${campaign ? campaign.name : id} successfully initialized.`,
      type: 'info'
    });
  };

  const renderPage = () => {
    return (
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p className="text-xs font-semibold">Loading Dashboard Page...</p>
          </div>
        }
      >
        {(() => {
          switch (activePage) {
            case 'dashboard':
              return <Dashboard findings={findings} />;
            case 'campaigns':
              return <Campaigns onNotify={triggerNotif} />;
            case 'assets':
              return <Assets onNotify={triggerNotif} />;
            case 'findings':
              return <Findings onNotify={triggerNotif} />;
            case 'risk':
              return <RiskDashboard onNotify={triggerNotif} />;
            case 'ai-insights':
              return <AIInsights onNotify={triggerNotif} />;
            case 'integrations':
              return <Integrations />;
            case 'users':
              return <Users onNotify={triggerNotif} />;
            case 'roles':
              return <Roles onNotify={triggerNotif} />;
            case 'permissions':
              return <Permissions onNotify={triggerNotif} />;
            case 'tenant-settings':
              return <TenantSettings onNotify={triggerNotif} />;
            case 'executive-dashboard':
              return <ExecutiveDashboard onNotify={triggerNotif} />;
            case 'reports':
              return <Reports onNotify={triggerNotif} />;
            case 'analytics':
              return <Analytics />;
            case 'deliverables':
              return <Deliverables onNotify={triggerNotif} />;
            case 'monitoring':
              return <Monitoring onNotify={triggerNotif} />;
            default:
              return <Dashboard findings={findings} />;
          }
        })()}
      </Suspense>
    );
  };

  // Render authentication pages if not authenticated
  if (!isAuthenticated) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p className="text-sm font-semibold">Loading Security Gateway...</p>
          </div>
        }
      >
        {authPage === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setAuthPage('signup')}
            onForgotPassword={handleForgotPassword}
          />
        )}
        {authPage === 'signup' && (
          <Signup
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setAuthPage('login')}
          />
        )}
        {authPage === 'mfa' && (
          <MFAVerification
            email={mfaEmail}
            onMFASuccess={handleMFASuccess}
            onResendCode={handleMFAResend}
            onBackToLogin={() => setAuthPage('login')}
          />
        )}
        {authPage === 'resetPassword' && (
          <ResetPassword
            email={resetPasswordEmail}
            onResetStart={handleResetPasswordComplete}
            onBackToLogin={() => setAuthPage('login')}
          />
        )}
        <Notification show={showNotification} message={notifMessage} />
      </Suspense>
    );
  }

  // Render dashboard if authenticated
  return (
    <>
      <AuthLayout
        activePage={activePage}
        onPageChange={setActivePage}
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
        clearNotifications={clearNotifications}
      >
        {renderPage()}
      </AuthLayout>
      <Notification show={showNotification} message={notifMessage} />
    </>
  );
}
