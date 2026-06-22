import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';

const Login = ({ onLoginSuccess, onSwitchToSignup, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
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
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      const emailLower = email.toLowerCase();
      let role = 'Admin';
      if (emailLower.includes('analyst')) {
        role = 'Analyst';
      } else if (emailLower.includes('executive')) {
        role = 'Executive';
      }
      onLoginSuccess({ email, role });
    }, 1500);
  };

  const handleForgotPasswordClick = () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    onForgotPassword(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">RedSpecter</h1>
          </div>
          <p className="text-slate-400">Security & Compliance Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome Back</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-orange-500"
                />
                <span className="text-sm text-slate-400">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 mt-6"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/50 text-slate-500">or</span>
            </div>
          </div>

          {/* Signup Link */}
          <p className="text-center text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left">
          <p className="text-xs text-blue-400 font-bold mb-2">Demo Credentials:</p>
          <p className="text-xs text-blue-300"><strong>Admin:</strong> admin@redspecter.com / admin123</p>
          <p className="text-xs text-blue-300"><strong>Analyst:</strong> analyst@redspecter.com / analyst123</p>
          <p className="text-xs text-blue-300"><strong>Executive:</strong> executive@redspecter.com / executive123</p>
          <p className="text-xs text-blue-300 mt-2"><strong>MFA Code:</strong> 123456</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
