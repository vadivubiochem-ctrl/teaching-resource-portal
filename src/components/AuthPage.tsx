import React, { useState, useEffect } from 'react';
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
  Key,
  ShieldCheck,
  Building2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { api, getSimulatedDevice, setSimulatedDevice } from '../services/api.js';
import { LocalStore } from '../services/store.js';
import type { User, School } from '../types.js';
import { InstitutionalRulesModal } from './InstitutionalRulesModal.js';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onDeviceChange?: (device: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onDeviceChange }) => {
  // Main view mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Multi-Tenancy School selection state
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>('STATE-405');
  const [customSchoolCodeInput, setCustomSchoolCodeInput] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);

  // Login form state
  const [identifier, setIdentifier] = useState('pssofttech@gmail.com');
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
  const [regSchoolMode, setRegSchoolMode] = useState<'existing' | 'new'>('existing');
  const [regSelectedSchoolCode, setRegSelectedSchoolCode] = useState('STATE-405');
  const [regNewSchoolName, setRegNewSchoolName] = useState('');
  const [regNewSchoolCode, setRegNewSchoolCode] = useState('');
  const [regRole, setRegRole] = useState<'teacher' | 'admin'>('teacher');

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [resetPin, setResetPin] = useState('');

  // Load available schools on mount
  useEffect(() => {
    api.getSchools().then((loaded) => {
      setSchools(loaded);
      if (loaded.length > 0 && !selectedSchoolCode) {
        setSelectedSchoolCode(loaded[0].code);
      }
    });
  }, []);

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

    const schoolCodeToSubmit = useCustomCode
      ? customSchoolCodeInput.trim()
      : selectedSchoolCode === 'ALL'
      ? undefined
      : selectedSchoolCode;

    try {
      const res = await api.login(identifier.trim(), password, device, schoolCodeToSubmit || undefined);
      setSuccessMessage(`Signed in as ${res.user.username} (${res.user.school_name || 'Govt Hr Sec School Pannaipuram'}). Loading dashboard...`);
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
      let schoolCodeToUse = regSelectedSchoolCode;
      if (regSchoolMode === 'new') {
        if (!regNewSchoolName.trim() || !regNewSchoolCode.trim()) {
          throw new Error('Please specify a School Name and unique School Code for the new institution.');
        }
        const createdSchool = await api.registerSchool({
          name: regNewSchoolName.trim(),
          code: regNewSchoolCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_'),
          storage_quota_bytes: 214748364800, // 200 GB
        });
        schoolCodeToUse = createdSchool.code;
      }

      const assignedRole: 'admin' | 'teacher' = regSchoolMode === 'new' ? 'admin' : regRole;
      const res = await api.register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        department: regDepartment.trim() || (assignedRole === 'admin' ? 'Administration' : 'General Faculty'),
        device,
        schoolCode: schoolCodeToUse,
        role: assignedRole,
      });
      setSuccessMessage(`Account created for ${res.user.username} as ${assignedRole.toUpperCase()} at ${res.user.school_name || 'School'}! Logging you in...`);
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
      <div className="max-w-xl w-full mx-auto relative z-10 mb-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Teacher Resource Hub
        </h1>
        <p className="text-sm text-indigo-300 font-medium mt-1">
          Centralized Cloud Storage &bull; Master Administrator &amp; Faculty Accounts
        </p>
      </div>

      {/* Centered Auth Card Container - Normal spacious panel size */}
      <div className="max-w-xl w-full mx-auto space-y-4 relative z-10">
        {/* Main Authentication Card */}
        <div className="bg-slate-800/95 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/80 backdrop-blur-md">
          {/* Top Auth Mode Tabs: Sign In vs Create Account */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 mb-6 border border-slate-700/60">
            <button
              type="button"
              id="tab-sign-in"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
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
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Teacher Account</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-sm flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: SIGN IN FLOW */}
          {authMode === 'login' && (
            <div>
              {/* Institutional School Selection */}
              <div className="mb-4 p-3 rounded-xl bg-slate-900/90 border border-indigo-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>Select Institution / School</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseCustomCode(!useCustomCode)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    {useCustomCode ? 'Choose from list' : 'Enter school code'}
                  </button>
                </div>

                {!useCustomCode ? (
                  <div className="relative">
                    <select
                      id="school-select"
                      value={selectedSchoolCode}
                      onChange={(e) => setSelectedSchoolCode(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="ALL">Auto-Detect School by Account</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.code}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter School Code (e.g. STATE-405)"
                      value={customSchoolCodeInput}
                      onChange={(e) => setCustomSchoolCodeInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Independent tenant isolation: Files &amp; faculty are scoped strictly to the selected school.</span>
                </div>
              </div>

              {/* Credentials Input Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
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
                      placeholder="e.g. pssofttech@gmail.com or vadivubichem@gmail.com"
                      className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
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
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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

                {/* Quick Multi-School Account Selector Pills */}
                <div className="p-3 bg-slate-900/70 border border-slate-700/60 rounded-xl space-y-2.5">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Quick Test Logins (Independent School Tenants):</span>
                    <span className="text-[11px] text-indigo-300 font-mono">pwd: password123</span>
                  </div>

                  {/* Govt Hr Sec School Pannaipuram */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold text-indigo-300 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-400" />
                      <span>Govt Hr Sec School Pannaipuram (Code: STATE-405)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="btn-quick-state-admin"
                        onClick={() => {
                          setIdentifier('pssofttech@gmail.com');
                          setPassword('password123');
                          setSelectedSchoolCode('STATE-405');
                          setUseCustomCode(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                          identifier === 'pssofttech@gmail.com'
                            ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div className="truncate">
                          <div className="truncate">pssofttech@gmail.com</div>
                          <div className="text-[10px] text-indigo-300 font-normal">State Admin</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        id="btn-quick-state-teacher"
                        onClick={() => {
                          setIdentifier('vadivubichem@gmail.com');
                          setPassword('password123');
                          setSelectedSchoolCode('STATE-405');
                          setUseCustomCode(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center gap-2 ${
                          identifier === 'vadivubichem@gmail.com'
                            ? 'bg-emerald-600/30 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <div className="truncate">vadivubichem@gmail.com</div>
                          <div className="text-[10px] text-emerald-300 font-normal">State Teacher</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500"
                    />
                    <span className="text-xs sm:text-sm text-slate-300 select-none">Remember Me</span>
                  </label>
                  <span className="text-xs text-slate-400">Scoped tenant security</span>
                </div>

                <button
                  type="submit"
                  id="login-submit-button"
                  disabled={loading}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Teacher Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CREATE TEACHER ACCOUNT */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs sm:text-sm text-indigo-200 flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Faculty Registration:</span> Enrolls a standard
                  Teacher account with 15 GB cloud storage under your institution's tenant partition.
                </div>
              </div>

              {/* School Affiliation Selector */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>Institutional Affiliation</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRegSchoolMode('existing')}
                      className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                        regSchoolMode === 'existing'
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Join Existing School
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegSchoolMode('new')}
                      className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                        regSchoolMode === 'new'
                          ? 'bg-emerald-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      + Register New School
                    </button>
                  </div>
                </div>

                {regSchoolMode === 'existing' ? (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Choose Your School / Institution
                    </label>
                    <div className="relative">
                      <select
                        value={regSelectedSchoolCode}
                        onChange={(e) => setRegSelectedSchoolCode(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
                      >
                        {schools.map((s) => (
                          <option key={s.id} value={s.code}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        New School / Institution Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regNewSchoolName}
                        onChange={(e) => setRegNewSchoolName(e.target.value)}
                        placeholder="e.g. St. Jude Secondary School"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        Unique School Code <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regNewSchoolCode}
                        onChange={(e) => setRegNewSchoolCode(e.target.value)}
                        placeholder="e.g. JUDE-301 or SCH_STJUDE"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Other teachers and administrators from your school will use this code to join.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Faculty Username <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. sarah_teacher"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Faculty Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. sarah@school.edu"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {regSchoolMode === 'new' ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>School Administrator Account (Master)</span>
                  </div>
                  <p className="text-[11px] text-emerald-400/80 mt-1">
                    As the registrant of this new institution, you will receive Administrator access to create and manage your school's faculty accounts in isolation.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        regRole === 'teacher'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Teacher (Faculty)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        regRole === 'admin'
                          ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      School Administrator
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="e.g. Biochemistry Department"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full px-3.5 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Teacher Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer"
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
