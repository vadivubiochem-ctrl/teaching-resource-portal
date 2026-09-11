import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  UserPlus,
  Scale,
} from 'lucide-react';
import { api, getSimulatedDevice, setSimulatedDevice } from '../services/api.js';
import { LocalStore } from '../services/store.js';
import type { User } from '../types.js';
import { InstitutionalRulesModal } from './InstitutionalRulesModal.js';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onDeviceChange?: (device: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onDeviceChange }) => {
  // Main view mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('vadivubichem@gmail.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [device, setDevice] = useState(getSimulatedDevice());

  // Institutional rules modal
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesModalTab, setRulesModalTab] = useState<'admin' | 'multi_user' | 'comparison'>('admin');

  // Registration form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('Biochemistry Department');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [resetPin, setResetPin] = useState('');

  const handleDeviceChange = (newDevice: string) => {
    setDevice(newDevice);
    setSimulatedDevice(newDevice);
    if (onDeviceChange) onDeviceChange(newDevice);
  };

  // Form submission login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.login(identifier.trim(), password, device);
      setSuccessMessage(`Signed in as ${res.user.username}. Loading dashboard...`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 300);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  // Registration handler for new Teacher accounts
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your passwords.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        department: regDepartment.trim() || 'Biochemistry Department',
        device,
      });
      setSuccessMessage(`Teacher account created for ${res.user.username}! Logging you in...`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Account creation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setForgotSuccessMsg(res.message);
      if (res.demoResetPin) {
        setResetPin(res.demoResetPin);
      }
      setForgotStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate reset.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    try {
      const res = await api.resetPassword(forgotEmail.trim(), newPassword);
      setForgotSuccessMsg(res.message);
      setPassword(newPassword);
      setIdentifier(forgotEmail);
      setTimeout(() => {
        setForgotOpen(false);
        setForgotStep('request');
        setForgotSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-md w-full mx-auto relative z-10 mb-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Teacher Resource Hub
        </h1>
        <p className="text-xs text-indigo-300 font-medium mt-1">
          Centralized Cloud Storage &bull; Master Administrator &amp; Faculty Accounts
        </p>
      </div>

      {/* Centered Auth Card Container */}
      <div className="max-w-md w-full mx-auto space-y-4 relative z-10">
        {/* Main Authentication Card */}
        <div className="bg-slate-800/90 py-6 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-700/80 backdrop-blur-md">
          {/* Top Auth Mode Tabs: Sign In vs Create Account */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 mb-5 border border-slate-700/60">
            <button
              type="button"
              id="tab-sign-in"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="tab-create-account"
              onClick={() => {
                setAuthMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Teacher Account</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: SIGN IN FLOW */}
          {authMode === 'login' && (
            <div>
              {/* Credentials Input Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email address or Username
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="identifier-input"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter email or username"
                      className="block w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="block w-full pl-10 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-300 select-none">Remember Me</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Password: password123</span>
                </div>

                <button
                  type="submit"
                  id="login-submit-button"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CREATE TEACHER ACCOUNT */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Faculty Registration:</span> Enrolls a standard
                  Teacher account with 15 GB cloud storage.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Faculty Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. sarah_teacher"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Faculty Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. sarah@school.edu"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="e.g. Biochemistry Department"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={regShowPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-3.5 py-2 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setRegShowPassword(!regShowPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Teacher Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Device Simulation Footer Setting (neatly separated so it does not confuse the user) */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-400">
          <span className="text-[11px] flex items-center gap-1.5">
            <span>Simulated Device:</span>
            <strong className="text-slate-300 font-mono text-[11px]">{device}</strong>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="device-sim-desktop"
              onClick={() => handleDeviceChange('Desktop (Windows 11 PC)')}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                device.includes('Desktop')
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Desktop Mode"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="device-sim-mobile"
              onClick={() => handleDeviceChange('Mobile (Android Phone)')}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                device.includes('Mobile')
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to Mobile Phone Mode"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Governance Rules Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Scale className="w-3 h-3" />
            <span>Institutional Governance Rules (pssofttech: Admin &bull; vadivubichem: Teacher)</span>
          </button>
        </div>
      </div>

      {/* Institutional Rules Modal */}
      <InstitutionalRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        initialTab={rulesModalTab}
      />

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <KeyRound className="w-5 h-5" />
                <span>Password Recovery</span>
              </div>
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setForgotStep('request');
                  setForgotSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {forgotSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{forgotSuccessMsg}</div>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-4">
                <p className="text-xs text-slate-300">
                  Enter your registered teacher email to receive a password reset code.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. vadivubichem@gmail.com"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Generate Reset Token
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 flex justify-between items-center">
                  <span>Verification PIN:</span>
                  <span className="font-mono font-bold text-emerald-400">{resetPin || '849201'}</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter secure new password"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Update &amp; Save New Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
