import React, { useState } from 'react';
import { Shield, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.fullName) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.email) {
      setError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!formData.companyName) {
      setError('Please enter your company name');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSignupSuccess({
        fullName: formData.fullName,
        email: formData.email,
        companyName: formData.companyName,
        role: 'admin',
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 py-12">
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

        {/* Signup Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-400 text-sm mb-6">Join RedSpecter to secure your infrastructure</p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Company Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Your Company"
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                required
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-orange-500 mt-0.5"
              />
              <span className="text-xs text-slate-400">
                I agree to the{' '}
                <a href="#" className="text-orange-500 hover:text-orange-400">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-orange-500 hover:text-orange-400">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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

          {/* Login Link */}
          <p className="text-center text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-orange-500 hover:text-orange-400 font-semibold transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <CheckCircle className="w-5 h-5 text-orange-500 mb-2" />
            <p className="text-xs text-slate-300">MFA Security</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <CheckCircle className="w-5 h-5 text-orange-500 mb-2" />
            <p className="text-xs text-slate-300">Real-time Monitoring</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <CheckCircle className="w-5 h-5 text-orange-500 mb-2" />
            <p className="text-xs text-slate-300">24/7 Support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
