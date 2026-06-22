'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Login page component using the global authorization hooks.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
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
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
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

        {/* Form Card */}
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
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
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
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
                {loading ? 'Signing in...' : 'Sign In'}
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
