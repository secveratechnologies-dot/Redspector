'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Mail, Lock, AlertCircle, KeyRound, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeLogin } = useAuth();

  // MFA Flow States
  const [showMfa, setShowMfa] = useState(false);
  const [tempData, setTempData] = useState<any>(null);
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Timer for resend code
  useEffect(() => {
    if (!showMfa) return;
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    } else {
      setCanResend(true);
    }
  }, [timer, showMfa]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Validate credentials with the backend login endpoint
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.data) {
        setTempData(res.data);
        setShowMfa(true);
        setTimer(60);
        setCanResend(false);
        setMfaCode(['', '', '', '', '', '']);
      } else {
        setError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newCode = [...mfaCode];
    newCode[index] = value;
    setMfaCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = mfaCode.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Validate code (enforcing 123456 as specified)
      if (fullCode === '123456') {
        completeLogin(tempData.user, tempData.accessToken);
      } else {
        setError('Invalid verification code. Please enter 123456.');
      }
    }, 1000);
  };

  const handleResendCode = () => {
    if (canResend) {
      setTimer(60);
      setCanResend(false);
      setMfaCode(['', '', '', '', '', '']);
      setError('');
    }
  };

  const handleBackToLogin = () => {
    setShowMfa(false);
    setTempData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-wide">RedSpecter</h1>
          </div>
          <p className="text-slate-400 text-sm">Security & Compliance Dashboard</p>
        </div>

        {/* Credentials Form Card */}
        {!showMfa ? (
          <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

              {/* Error alerts */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="pl-10 bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-slate-950 border-slate-800 text-white placeholder-slate-600 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-orange-500/10 transition-all mt-6"
                >
                  {loading ? 'Checking credentials...' : 'Sign In'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-500">or</span>
                </div>
              </div>

              <p className="text-center text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          /* MFA Verification Form Card */
          <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-2xl animate-in">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <KeyRound className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    Enter the 6-digit validation code sent to your account device.
                  </p>
                </div>
              </div>

              {/* Error Alerts */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-6">
                <div className="flex gap-2.5 justify-center">
                  {mfaCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      placeholder="0"
                      className="w-12 h-14 text-center text-2xl font-extrabold bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={loading || mfaCode.join('').length !== 6}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-orange-500/10 transition-all"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>

              {/* Resend Code Section */}
              <div className="mt-6 pt-6 border-t border-slate-850 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend}
                  className={`text-xs font-semibold transition ${
                    canResend
                      ? 'text-orange-500 hover:text-orange-400'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  Resend Validation Code
                </button>

                {!canResend && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Resend code in {timer}s</span>
                  </div>
                )}
              </div>

              {/* Back to credentials button */}
              <button
                onClick={handleBackToLogin}
                className="w-full mt-4 text-center text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Back to Sign In
              </button>
            </CardContent>
          </Card>
        )}

        {/* Test details banner */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-400 font-bold mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-300"><strong>Admin:</strong> admin@redspecter.com / admin123</p>
          <p className="text-xs text-blue-300"><strong>Analyst:</strong> analyst@redspecter.com / analyst123</p>
          <p className="text-xs text-blue-300"><strong>Executive:</strong> executive@redspecter.com / executive123</p>
          <p className="text-xs text-blue-300 mt-2"><strong>MFA Verification Code:</strong> 123456</p>
        </div>
      </div>
    </div>
  );
}
