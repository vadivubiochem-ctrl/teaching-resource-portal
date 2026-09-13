import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  HardDrive,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Plus,
  Sliders,
  Check,
  X,
  Sparkles,
  FileText,
  Video,
  Music,
  ImageIcon,
  Copy,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import type { User, School, TeacherPermissions } from '../types.js';
import { DEFAULT_TEACHER_PERMISSIONS } from '../types.js';
import { api } from '../services/api.js';
import { formatBytes, formatDate } from '../utils/formatters.js';

interface InstitutionalManagementProps {
  currentUser: User;
  onRefresh?: () => void;
}

export const InstitutionalManagement: React.FC<InstitutionalManagementProps> = ({
  currentUser,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.schoolId || 'SCH_PANNAIPURAM'
  );
  const [analytics, setAnalytics] = useState<any>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Register New School Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regSchoolCode, setRegSchoolCode] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regContactEmail, setRegContactEmail] = useState('');
  const [regQuotaGB, setRegQuotaGB] = useState<number>(200);

  // Edit School Settings Modal
  const [editSchoolModalOpen, setEditSchoolModalOpen] = useState(false);
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolAddress, setEditSchoolAddress] = useState('');
  const [editSchoolEmail, setEditSchoolEmail] = useState('');
  const [editSchoolQuotaGB, setEditSchoolQuotaGB] = useState<number>(200);

  // Add Teacher to Institution Modal
  const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('password123');
  const [teacherDept, setTeacherDept] = useState('General Faculty');
  const [teacherQuotaGB, setTeacherQuotaGB] = useState<number>(15);
  const [teacherRole, setTeacherRole] = useState<'teacher' | 'admin'>('teacher');

  // Adjust Teacher Quota / Edit Modal
  const [editTeacher, setEditTeacher] = useState<User | null>(null);
  const [editTeacherDept, setEditTeacherDept] = useState('');
  const [editTeacherQuotaGB, setEditTeacherQuotaGB] = useState<number>(15);

  // Password reset modal
  const [resetTeacher, setResetTeacher] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Load Institutional Data
  const loadData = async (schoolIdToLoad?: string) => {
    setLoading(true);
    try {
      const allSchools = await api.getSchools();
      setSchools(allSchools);

      const targetSchoolId = schoolIdToLoad || selectedSchoolId || currentUser.schoolId || 'SCH_PANNAIPURAM';
      const targetSchool = allSchools.find((s) => s.id === targetSchoolId) || allSchools[0];
      if (targetSchool) {
        setSelectedSchoolId(targetSchool.id);
      }

      // Fetch institutional analytics for this school
      const data = await api.getInstitutionalAnalytics(targetSchool?.id || targetSchoolId);
      setAnalytics(data);

      // Fetch all users and filter by this schoolId
      const allUsers = await api.getAdminDashboard();
      const schoolTeachers = (allUsers.users || []).filter(
        (u: User) => u.schoolId === (targetSchool?.id || targetSchoolId)
      );
      setTeachers(schoolTeachers);
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to load institutional data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSchoolId]);

  // Handle Register New School
  const handleRegisterSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regSchoolName.trim() || !regSchoolCode.trim()) {
      setBanner({ type: 'error', text: 'School Name and Unique Code are required.' });
      return;
    }

    try {
      const cleanCode = regSchoolCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_');
      const newSchool = await api.registerSchool({
        name: regSchoolName.trim(),
        code: cleanCode,
        address: regAddress.trim() || undefined,
        contact_email: regContactEmail.trim() || undefined,
        storage_quota_bytes: Math.round(regQuotaGB * 1024 * 1024 * 1024),
      });

      setBanner({
        type: 'success',
        text: `Institution "${newSchool.name}" (Code: ${newSchool.code}) successfully registered with ${regQuotaGB} GB allocated quota!`,
      });

      setRegisterModalOpen(false);
      setRegSchoolName('');
      setRegSchoolCode('');
      setRegAddress('');
      setRegContactEmail('');
      setRegQuotaGB(200);

      // Switch to new school
      setSelectedSchoolId(newSchool.id);
      await loadData(newSchool.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Registration failed.' });
    }
  };

  // Handle Edit Current School Settings
  const handleOpenEditSchool = () => {
    if (!analytics?.school) return;
    setEditSchoolName(analytics.school.name || '');
    setEditSchoolAddress(analytics.school.address || '');
    setEditSchoolEmail(analytics.school.contact_email || '');
    setEditSchoolQuotaGB(
      Math.round((analytics.school.storage_quota_bytes || 214748364800) / (1024 * 1024 * 1024))
    );
    setEditSchoolModalOpen(true);
  };

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return;

    try {
      await api.updateSchool(selectedSchoolId, {
        name: editSchoolName.trim(),
        address: editSchoolAddress.trim(),
        contact_email: editSchoolEmail.trim(),
        storage_quota_bytes: Math.round(editSchoolQuotaGB * 1024 * 1024 * 1024),
      });

      setBanner({ type: 'success', text: 'Institutional profile and storage limits updated.' });
      setEditSchoolModalOpen(false);
      loadData(selectedSchoolId);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to update school settings.' });
    }
  };

  // Handle Add Teacher to Selected Institution
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherUsername.trim() || !teacherEmail.trim()) {
      setBanner({ type: 'error', text: 'Username and email are required.' });
      return;
    }

    try {
      const activeSchool = schools.find((s) => s.id === selectedSchoolId);
      await api.createAdminUser({
        username: teacherUsername.trim(),
        email: teacherEmail.trim(),
        password: teacherPassword || 'password123',
        role: teacherRole,
        department: teacherDept.trim() || 'General Faculty',
        storage_limit: Math.round(teacherQuotaGB * 1024 * 1024 * 1024),
        permissions: teacherRole === 'teacher' ? { ...DEFAULT_TEACHER_PERMISSIONS } : undefined,
      });

      setBanner({
        type: 'success',
        text: `Faculty member "${teacherUsername}" enrolled into ${activeSchool?.name || 'Institution'} (${activeSchool?.code || selectedSchoolId}).`,
      });

      setAddTeacherModalOpen(false);
      setTeacherUsername('');
      setTeacherEmail('');
      setTeacherPassword('password123');
      setTeacherDept('General Faculty');
      setTeacherQuotaGB(15);
      setTeacherRole('teacher');

      loadData(selectedSchoolId);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to enroll teacher.' });
    }
  };

  // Handle Edit Teacher
  const handleOpenEditTeacher = (u: User) => {
    setEditTeacher(u);
    setEditTeacherDept(u.department || 'General Faculty');
    setEditTeacherQuotaGB(Math.round((u.storage_limit || 16106127360) / (1024 * 1024 * 1024)));
  };

  const handleSaveTeacherEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;

    try {
      await api.updateAdminUser(editTeacher.id, {
        department: editTeacherDept.trim(),
        storage_limit: Math.round(editTeacherQuotaGB * 1024 * 1024 * 1024),
      });

      setBanner({ type: 'success', text: `Updated faculty profile for ${editTeacher.username}.` });
      setEditTeacher(null);
      loadData(selectedSchoolId);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handle Toggle Teacher Status
  const handleToggleStatus = async (u: User) => {
    if (u.id === currentUser.id) {
      setBanner({ type: 'error', text: 'You cannot suspend your own active administrator account.' });
      return;
    }
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAdminUser(u.id, { status: newStatus });
      setBanner({ type: 'success', text: `Account for ${u.username} is now ${newStatus}.` });
      loadData(selectedSchoolId);
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handle Reset Password
  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTeacher || !newPasswordVal) return;

    try {
      await api.updateAdminUser(resetTeacher.id, { password: newPasswordVal });
      setBanner({ type: 'success', text: `Password successfully reset for ${resetTeacher.username}.` });
      setResetTeacher(null);
      setNewPasswordVal('');
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handle Delete Teacher
  const handleDeleteTeacher = async (u: User) => {
    if (u.id === currentUser.id) {
      setBanner({ type: 'error', text: 'You cannot delete your own active administrator account.' });
      return;
    }
    if (!window.confirm(`Are you sure you want to remove teacher "${u.username}" and their resources from this school?`)) {
      return;
    }

    try {
      await api.deleteAdminUser(u.id);
      setBanner({ type: 'success', text: `Faculty member ${u.username} removed.` });
      loadData(selectedSchoolId);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Copy school code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentSchool = analytics?.school || schools.find((s) => s.id === selectedSchoolId);
  const quotaBytes = currentSchool?.storage_quota_bytes || 214748364800;
  const storageUsed = analytics?.totalStorageUsed || 0;
  const percentageUsed = quotaBytes > 0 ? Math.min(100, (storageUsed / quotaBytes) * 100) : 0;
  const media = analytics?.mediaBreakdown || { video: 0, audio: 0, document: 0, image: 0, other: 0 };

  return (
    <div className="space-y-6">
      {/* Banner */}
      {banner && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
            banner.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/70 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-slate-400 hover:text-white cursor-pointer ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card & School Selector */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
              <Building2 className="w-4 h-4" />
              <span>Multi-School Tenant Architecture</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Institutional Management</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage school registration codes, configure institutional storage pools, and oversee isolated faculty rosters.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => loadData(selectedSchoolId)}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Refresh Institutional Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              id="btn-edit-school"
              onClick={handleOpenEditSchool}
              className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>School Settings</span>
            </button>

            <button
              type="button"
              id="btn-register-school"
              onClick={() => setRegisterModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New School</span>
            </button>
          </div>
        </div>

        {/* School Tenant Switcher & Current School Profile Strip */}
        <div className="pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-400 whitespace-nowrap">
              Active School Tenant:
            </label>
            <select
              id="active-school-selector"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-indigo-500/50 rounded-lg text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {currentSchool && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400">School Code:</span>
                <span className="font-mono font-bold text-indigo-300">{currentSchool.code}</span>
                <button
                  onClick={() => handleCopyCode(currentSchool.code)}
                  className="ml-1 text-slate-400 hover:text-white cursor-pointer"
                  title="Copy School Code for Faculty Registration"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="hidden md:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400">Partition Key:</span>
                <span className="font-mono text-slate-300">{currentSchool.id}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: SCOPED INSTITUTIONAL STORAGE ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Overall School Quota Progress Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Institutional Storage Quota</span>
              </div>
              <span className="text-xs font-extrabold text-indigo-400">
                {percentageUsed.toFixed(1)}% Used
              </span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percentageUsed > 85
                    ? 'bg-rose-500'
                    : percentageUsed > 60
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-indigo-500 to-blue-500'
                }`}
                style={{ width: `${Math.max(2, percentageUsed)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>{formatBytes(storageUsed)} consumed</span>
              <span>{formatBytes(quotaBytes)} allocated</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Enrolled Faculty:</span>
              <strong className="text-white">{teachers.length} teachers</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Curriculum Files:</span>
              <strong className="text-white">{analytics?.totalFiles ?? 0} files</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Curriculum Folders:</span>
              <strong className="text-white">{analytics?.totalFolders ?? 0} folders</strong>
            </div>
          </div>
        </div>

        {/* Media Type Breakdown for Institution */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-1">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Curriculum Media Breakdown</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-rose-300">
                <Video className="w-4 h-4 text-rose-400" />
                <span>Video Lectures &amp; Labs</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{formatBytes(media.video)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-teal-300">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Documents &amp; Worksheets</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{formatBytes(media.document)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-purple-300">
                <Music className="w-4 h-4 text-purple-400" />
                <span>Audio Materials</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{formatBytes(media.audio)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-300">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Images &amp; Diagrams</span>
              </div>
              <span className="font-mono font-bold text-slate-200">{formatBytes(media.image)}</span>
            </div>
          </div>
        </div>

        {/* Department Roster Breakdown */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Department Distribution</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(analytics?.departmentStats || []).length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No department records yet.</div>
              ) : (
                analytics.departmentStats.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{d.department}</div>
                      <div className="text-[10px] text-slate-400">{d.teacherCount} faculty member(s)</div>
                    </div>
                    <div className="font-mono text-slate-300 font-semibold">{formatBytes(d.storageUsed)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/70 text-[11px] text-indigo-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Strict cross-school tenant data boundary enforced by API middleware.</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: INSTITUTION'S UNIQUE FACULTY ROSTER */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {currentSchool?.name || 'Institution'} Faculty Roster
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-xs font-semibold border border-indigo-800">
                {teachers.length} Teachers
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All accounts below belong strictly to this school tenant ({currentSchool?.code || selectedSchoolId}).
            </p>
          </div>

          <button
            type="button"
            id="btn-enroll-teacher"
            onClick={() => setAddTeacherModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Teacher to This School</span>
          </button>
        </div>

        {/* Teachers Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Storage Footprint</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 bg-slate-800/40">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No faculty members are enrolled in this school yet. Use the "Enroll Teacher" button to add one!
                  </td>
                </tr>
              ) : (
                teachers.map((u) => {
                  const used = u.storage_used || 0;
                  const limit = u.storage_limit || 16106127360;
                  const pct = Math.min(100, Math.round((used / limit) * 100));

                  return (
                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{u.username}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            u.role === 'admin'
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {u.role === 'admin' ? 'Administrator' : 'Faculty Teacher'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-200">
                        {u.department || 'General Faculty'}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct > 85 ? 'bg-rose-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-300">
                            {formatBytes(used)} / {formatBytes(limit)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                              : 'bg-rose-950/80 text-rose-300 border-rose-700 hover:bg-rose-900'
                          }`}
                        >
                          {u.status === 'active' ? 'Active' : 'Suspended'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTeacher(u)}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                            title="Edit Department &amp; Quota"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setResetTeacher(u);
                              setNewPasswordVal('password123');
                            }}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                            title="Reset Teacher Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {u.id !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTeacher(u)}
                              className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors cursor-pointer"
                              title="Delete Teacher from Institution"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER NEW SCHOOL TENANT */}
      {registerModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Register New School Institution</span>
              </div>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSchool} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  School Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Secondary School"
                  value={regSchoolName}
                  onChange={(e) => setRegSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Unique School Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JUDE-301 or SCH_STJUDE"
                  value={regSchoolCode}
                  onChange={(e) => setRegSchoolCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Teachers and administrators will provide this code during registration to join this school.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Physical Campus Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 450 Education Blvd, North District"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Administrative Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. principal@stjude.edu"
                  value={regContactEmail}
                  onChange={(e) => setRegContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Allocated Cloud Storage Pool (GB)
                </label>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={regQuotaGB}
                  onChange={(e) => setRegQuotaGB(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-200">
                Independent tenant partition will be provisioned. All files, users, and audit records for this school will be segregated from other institutions.
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-md cursor-pointer"
                >
                  Register School Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SCHOOL SETTINGS */}
      {editSchoolModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Configure School Settings</span>
              </div>
              <button
                onClick={() => setEditSchoolModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchoolSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={editSchoolName}
                  onChange={(e) => setEditSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Address</label>
                <input
                  type="text"
                  value={editSchoolAddress}
                  onChange={(e) => setEditSchoolAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editSchoolEmail}
                  onChange={(e) => setEditSchoolEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Institutional Storage Quota (GB)
                </label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={editSchoolQuotaGB}
                  onChange={(e) => setEditSchoolQuotaGB(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditSchoolModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-md cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENROLL TEACHER TO THIS SCHOOL */}
      {addTeacherModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-base">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <span>Enroll Faculty Member</span>
              </div>
              <button
                onClick={() => setAddTeacherModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-200">
              Enrolling into: <strong className="text-white">{currentSchool?.name || 'Institution'}</strong> (Code: {currentSchool?.code || selectedSchoolId})
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. john_teacher"
                  value={teacherUsername}
                  onChange={(e) => setTeacherUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@school.edu"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics Department"
                  value={teacherDept}
                  onChange={(e) => setTeacherDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="text"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quota (GB)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={teacherQuotaGB}
                    onChange={(e) => setTeacherQuotaGB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddTeacherModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 shadow-md cursor-pointer"
                >
                  Enroll Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEACHER DEPT & QUOTA */}
      {editTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="font-bold text-white text-base">Edit Faculty Member: {editTeacher.username}</div>
              <button onClick={() => setEditTeacher(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacherEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={editTeacherDept}
                  onChange={(e) => setEditTeacherDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Storage Quota (GB)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={editTeacherQuotaGB}
                  onChange={(e) => setEditTeacherQuotaGB(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditTeacher(null)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="font-bold text-white text-base">Reset Password: {resetTeacher.username}</div>
              <button onClick={() => setResetTeacher(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetTeacher(null)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500 shadow-md cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
