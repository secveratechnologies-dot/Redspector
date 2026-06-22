import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResetPassword = ({ email, onResetStart, onBackToLogin }) => {
  const [step, setStep] = useState('request'); // 'request', 'verify', 'reset', 'success'
  const [resetEmail, setResetEmail] = useState(email || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Request password reset
  const handleRequestReset = (e) => {
    e.preventDefault();
    setError('');

    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('verify');
      setSuccessMessage(`Reset code sent to ${resetEmail}`);
    }, 1500);
  };

  // Step 2: Verify code
  const handleVerifyCode = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    if (verificationCode.length < 6) {
      setError('Verification code must be at least 6 characters');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('reset');
    }, 1500);
  };

  // Step 3: Set new password
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  // Success state
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">RedSpecter</h1>
            </div>
            <p className="text-slate-400">Security & Compliance Dashboard</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-500/20 rounded-full border border-green-500/30">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h2>
            <p className="text-slate-400 mb-6">
              Your password has been successfully changed. You can now login with your new password.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">RedSpecter</h1>
          </div>
          <p className="text-slate-400">Security & Compliance Dashboard</p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-slate-400 text-sm mb-6">
            {step === 'request' && 'Enter your email to receive a reset code'}
            {step === 'verify' && 'Enter the verification code sent to your email'}
            {step === 'reset' && 'Create a new password for your account'}
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 mt-6"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Step 2: Verification Code */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 mt-6"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full py-2 text-slate-400 hover:text-slate-300 font-medium transition-colors"
              >
                Back
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 mt-6"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep('verify')}
                className="w-full py-2 text-slate-400 hover:text-slate-300 font-medium transition-colors"
              >
                Back
              </button>
            </form>
          )}

          {/* Back to Login */}
          <button
            onClick={onBackToLogin}
            className="w-full mt-6 py-2 text-slate-400 hover:text-slate-300 font-medium transition-colors border-t border-slate-700 pt-6"
          >
            Back to Login
          </button>
        </div>

        {/* Demo Info */}
        {step !== 'success' && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400">
              <strong>Demo Mode:</strong> Use verification code: 123456
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
