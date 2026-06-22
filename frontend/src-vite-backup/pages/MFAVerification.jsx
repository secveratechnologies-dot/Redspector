import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Clock } from 'lucide-react';

const MFAVerification = ({ email, onMFASuccess, onResendCode, onBackToLogin }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer for resend code
  useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Accept any 6-digit code for demo
      if (fullCode) {
        onMFASuccess({ email, mfaVerified: true });
      }
    }, 1500);
  };

  const handleResendCode = () => {
    if (canResend) {
      setTimer(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      onResendCode();
    }
  };

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

        {/* MFA Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <KeyRound className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-400 mt-1">
                Enter the 6-digit code sent to {email}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Code Input */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength="1"
                  placeholder="0"
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
            <button
              onClick={handleResendCode}
              disabled={!canResend}
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                canResend
                  ? 'text-orange-500 hover:text-orange-400'
                  : 'text-slate-500 cursor-not-allowed'
              }`}
            >
              Resend Code
            </button>

            {!canResend && (
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Resend code in {timer}s</span>
              </div>
            )}
          </div>

          {/* Back Button */}
          <button
            onClick={onBackToLogin}
            className="w-full mt-4 py-2 text-slate-400 hover:text-slate-300 font-medium transition-colors"
          >
            Back to Login
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400">
            <strong>Demo Mode:</strong> Enter any 6-digit code for testing (e.g., 123456)
          </p>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
