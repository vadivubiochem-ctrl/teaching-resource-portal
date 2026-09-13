import React, { useState, useEffect } from 'react';
import {
  Users,
  HardDrive,
  BarChart3,
  ShieldAlert,
  UserPlus,
  Trash2,
  Lock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Smartphone,
  Laptop,
  Search,
  Sparkles,
  KeyRound,
  FileText,
  Video,
  Music,
  ImageIcon,
  FolderTree,
  Download,
  Printer,
  Sliders,
  Filter,
  RefreshCw,
  Clock,
  Shield,
  Check,
  X,
  AlertTriangle,
  Edit3,
  Unlock,
  SlidersHorizontal,
  FolderPlus,
  Share2,
  Upload,
  Scale,
  Building2,
} from 'lucide-react';
import type { User, AuditLog, TeacherPermissions } from '../types.js';
import { DEFAULT_TEACHER_PERMISSIONS } from '../types.js';
import { api } from '../services/api.js';
import { LocalStore } from '../services/store.js';
import { formatBytes, formatDate, formatDateTime } from '../utils/formatters.js';
import { ADMIN_RULES, MULTI_USER_RULES } from '../services/institutionalRules.js';
import { InstitutionalManagement } from './InstitutionalManagement.js';

interface AdminDashboardProps {
  currentUser: User;
  initialTab?: 'institution' | 'users' | 'storage' | 'reports' | 'security' | 'rules';
  onTabChange?: (tab: 'institution' | 'users' | 'storage' | 'reports' | 'security' | 'rules') => void;
  onRefreshUser?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  initialTab = 'institution',
  onTabChange,
  onRefreshUser,
}) => {
  const [activeTab, setActiveTab] = useState<'institution' | 'users' | 'storage' | 'reports' | 'security' | 'rules'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filtering states for User Management
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Filtering states for Security & Logs
  const [searchLog, setSearchLog] = useState('');
  const [actionCategoryFilter, setActionCategoryFilter] = useState<'all' | 'auth' | 'file' | 'admin' | 'trash'>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');

  // Add user modal
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'teacher' | 'admin'>('teacher');
  const [newDept, setNewDept] = useState('');
  const [newQuotaGB, setNewQuotaGB] = useState<number>(15);

  // Edit user modal
  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRole, setEditRole] = useState<'teacher' | 'admin'>('teacher');
  const [editQuotaGB, setEditQuotaGB] = useState<number>(15);

  // Password reset modal
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  // Permissions & Access Rights modal
  const [permissionsModalUser, setPermissionsModalUser] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<TeacherPermissions>({ ...DEFAULT_TEACHER_PERMISSIONS });

  // Initial permissions for newly created faculty teacher
  const [newPermissions, setNewPermissions] = useState<TeacherPermissions>({ ...DEFAULT_TEACHER_PERMISSIONS });

  // Delete user confirmation modal
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Adjust quota modal
  const [quotaModalUser, setQuotaModalUser] = useState<User | null>(null);
  const [quotaValGB, setQuotaValGB] = useState<number>(15);

  // Empty system trash confirmation modal
  const [emptyTrashModalOpen, setEmptyTrashModalOpen] = useState(false);

  // Archive logs confirmation modal
  const [archiveLogsModalOpen, setArchiveLogsModalOpen] = useState(false);

  // Message banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync with prop when external navigation happens (e.g. from Sidebar)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tab: 'institution' | 'users' | 'storage' | 'reports' | 'security' | 'rules') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminDashboard();
      setMetrics(data.metrics);
      setUsers(data.users);
      setAuditLogs(data.auditLogs);
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to fetch admin data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Handler: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword || 'admin123',
        role: newRole,
        department: newDept.trim() || (newRole === 'admin' ? 'System Administration' : 'General Faculty'),
        storage_limit: Math.round(newQuotaGB * 1024 * 1024 * 1024),
        permissions: newRole === 'teacher' ? { ...newPermissions } : undefined,
      });
      setBanner({ type: 'success', text: `Account for "${newUsername}" created successfully as ${newRole.toUpperCase()}.` });
      setAddUserOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewDept('');
      setNewRole('teacher');
      setNewQuotaGB(15);
      setNewPermissions({ ...DEFAULT_TEACHER_PERMISSIONS });
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to create user.' });
    }
  };

  // Handler: Open Permissions Modal for Teacher
  const handleOpenPermissionsModal = (u: User) => {
    if (u.role === 'admin') {
      setBanner({ type: 'error', text: 'Master Administrator has unrestricted full institutional access across all modules.' });
      return;
    }
    setPermissionsModalUser(u);
    setEditPermissions({ ...(u.permissions || DEFAULT_TEACHER_PERMISSIONS) });
  };

  // Handler: Save Teacher Permissions
  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionsModalUser) return;
    try {
      await api.updateTeacherPermissions(permissionsModalUser.id, editPermissions);
      setBanner({
        type: 'success',
        text: `Access rights and operational permissions updated for teacher "${permissionsModalUser.username}".`,
      });
      setPermissionsModalUser(null);
      fetchAdminData();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to update teacher permissions.' });
    }
  };

  // Handler: Fast Toggle Individual Permission from User Table
  const handleQuickTogglePerm = async (targetUser: User, permKey: keyof TeacherPermissions) => {
    if (targetUser.role === 'admin') {
      setBanner({ type: 'error', text: 'Cannot restrict Master Administrator permissions.' });
      return;
    }
    const currentVal = targetUser.permissions ? targetUser.permissions[permKey] : true;
    const updatedPerms: Partial<TeacherPermissions> = {
      [permKey]: !currentVal,
    };
    try {
      await api.updateTeacherPermissions(targetUser.id, updatedPerms);
      const permLabel = permKey.replace('can_', '').replace('_', ' ').toUpperCase();
      setBanner({
        type: 'success',
        text: `${permLabel} permission for "${targetUser.username}" is now ${!currentVal ? 'ALLOWED' : 'DISABLED'}.`,
      });
      fetchAdminData();
      if (onRefreshUser) onRefreshUser();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to toggle permission.' });
    }
  };

  // Handler: Apply Predefined Permission Preset
  const handleApplyPermissionPreset = (preset: 'full' | 'standard' | 'restricted' | 'readonly') => {
    if (preset === 'full') {
      setEditPermissions({
        can_upload: true,
        can_delete: true,
        can_share: true,
        can_create_folder: true,
        can_download: true,
        can_rename: true,
      });
    } else if (preset === 'standard') {
      setEditPermissions({
        can_upload: true,
        can_delete: false, // Protected against deletions
        can_share: true,
        can_create_folder: true,
        can_download: true,
        can_rename: true,
      });
    } else if (preset === 'readonly') {
      setEditPermissions({
        can_upload: false,
        can_delete: false,
        can_share: true,
        can_create_folder: false,
        can_download: true,
        can_rename: false,
      });
    } else if (preset === 'restricted') {
      setEditPermissions({
        can_upload: true,
        can_delete: false,
        can_share: false,
        can_create_folder: false,
        can_download: true,
        can_rename: false,
      });
    }
  };

  // Handler: Edit User
  const handleOpenEditUser = (u: User) => {
    setEditModalUser(u);
    setEditUsername(u.username);
    setEditEmail(u.email);
    setEditDept(u.department || 'General Faculty');
    setEditRole(u.role);
    setEditQuotaGB(Math.round((u.storage_limit || 16106127360) / (1024 * 1024 * 1024)));
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalUser) return;
    try {
      await api.updateAdminUser(editModalUser.id, {
        username: editUsername.trim(),
        email: editEmail.trim(),
        department: editDept.trim(),
        role: editRole,
        storage_limit: Math.round(editQuotaGB * 1024 * 1024 * 1024),
      });
      setBanner({ type: 'success', text: `Profile updated for ${editUsername}.` });
      setEditModalUser(null);
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to update user profile.' });
    }
  };

  // Handler: Toggle Role (Enforcing Single Sovereign Admin & Disabled Admin Rights for Multi-Users)
  const handleToggleRole = async (user: User) => {
    const isMasterAdmin =
      user.id === 'usr_pssofttech' ||
      user.email.toLowerCase() === 'pssofttech@gmail.com';

    if (isMasterAdmin) {
      setBanner({
        type: 'error',
        text: `pssofttech@gmail.com is the Sovereign Master Administrator and cannot be demoted or modified.`,
      });
      return;
    }

    // Attempting to elevate teacher to admin is barred by institutional rule
    setBanner({
      type: 'error',
      text: `Institutional Rule RULE_ADM_02: Administrative rights are disabled for multi-user accounts. Exactly one Master Administrator is permitted across the institution.`,
    });
  };

  // Handler: Toggle Status
  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser.id) {
      setBanner({ type: 'error', text: 'You cannot suspend your own active administrator account.' });
      return;
    }
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateAdminUser(user.id, { status: newStatus });
      setBanner({ type: 'success', text: `User ${user.username} is now ${newStatus}.` });
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handler: Delete User Permanently
  const handleConfirmDeleteUser = async () => {
    if (!deleteModalUser) return;
    if (deleteModalUser.id === currentUser.id) {
      setBanner({ type: 'error', text: 'You cannot delete your own active administrator account.' });
      setDeleteModalUser(null);
      return;
    }
    setDeleteLoading(true);
    try {
      const userToDelete = deleteModalUser;
      await api.deleteAdminUser(userToDelete.id);
      // Immediately remove from current state table
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setBanner({
        type: 'success',
        text: `User account "${userToDelete.username}" (${userToDelete.email}) and all associated files/folders have been permanently deleted.`,
      });
      setDeleteModalUser(null);
      await fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message || 'Failed to permanently delete user account.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handler: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetPasswordVal) return;
    try {
      await api.updateAdminUser(resetModalUser.id, { password: resetPasswordVal });
      setBanner({ type: 'success', text: `Password successfully updated for ${resetModalUser.username}.` });
      setResetModalUser(null);
      setResetPasswordVal('');
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handler: Adjust Quota
  const handleOpenQuotaModal = (u: User) => {
    setQuotaModalUser(u);
    setQuotaValGB(Math.round((u.storage_limit || 16106127360) / (1024 * 1024 * 1024)));
  };

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotaModalUser) return;
    try {
      const bytes = Math.round(quotaValGB * 1024 * 1024 * 1024);
      await api.updateAdminUser(quotaModalUser.id, { storage_limit: bytes });
      setBanner({ type: 'success', text: `Storage quota for ${quotaModalUser.username} set to ${quotaValGB} GB.` });
      setQuotaModalUser(null);
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handler: Empty System Trash
  const handleEmptySystemTrash = async () => {
    try {
      const res = await api.emptySystemTrash();
      setBanner({ type: 'success', text: `System trash purged: permanently deleted ${res.count} file(s).` });
      setEmptyTrashModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handler: Empty User Trash
  const handleEmptyUserTrash = async (userId: string, username: string) => {
    try {
      const res = await api.emptyUserTrash(userId);
      setBanner({ type: 'success', text: `Trash emptied for ${username}: ${res.count} file(s) purged.` });
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handler: Archive Logs
  const handleArchiveLogs = async () => {
    try {
      await api.clearAuditLogs();
      setBanner({ type: 'success', text: 'Audit logs archived and reset with fresh ledger entry.' });
      setArchiveLogsModalOpen(false);
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Handler: Simulate Security Event
  const handleSimulateSecurityEvent = async () => {
    try {
      await api.simulateSecurityEvent();
      setBanner({ type: 'success', text: 'Simulated security audit verification event recorded in audit ledger.' });
      fetchAdminData();
    } catch (err: any) {
      setBanner({ type: 'error', text: err.message });
    }
  };

  // Export: System Report CSV
  const handleExportReportCSV = () => {
    if (!metrics) return;
    const rows = [
      ['TeacherHub Educational Resource Management - Administrative System Report'],
      ['Generated On', new Date().toISOString()],
      ['Generated By', currentUser.username + ' (' + currentUser.email + ')'],
      [],
      ['SYSTEM OVERVIEW'],
      ['Total Users', metrics.totalUsers],
      ['Active Users', metrics.activeUsers],
      ['Total Curricula Files', metrics.totalFiles],
      ['Total Curricula Folders', metrics.totalFolders],
      ['Lesson Videos', metrics.totalVideos],
      ['Worksheets & Documents', metrics.totalDocuments],
      ['Audio Lectures', metrics.totalAudio],
      ['Educational Images', metrics.totalImages],
      ['Total Cloud Storage Used (Bytes)', metrics.totalStorageUsed],
      ['Total Cloud Storage Used (Formatted)', formatBytes(metrics.totalStorageUsed)],
      ['Today Uploads', metrics.todayUploads],
      ['Pending Trashed Files', metrics.trashedCount || 0],
      ['Trashed Storage Footprint', formatBytes(metrics.trashedSize || 0)],
      [],
      ['FACULTY QUOTAS & USAGE BREAKDOWN'],
      ['Username', 'Email', 'Role', 'Status', 'Department', 'Storage Used (Bytes)', 'Storage Used', 'Storage Limit (Bytes)', 'Storage Limit', 'Usage %'],
      ...users.map((u) => [
        u.username,
        u.email,
        u.role,
        u.status,
        u.department || 'General Faculty',
        u.storage_used,
        formatBytes(u.storage_used),
        u.storage_limit,
        formatBytes(u.storage_limit),
        `${Math.min(100, Math.round((u.storage_used / (u.storage_limit || 1)) * 100))}%`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TeacherHub_System_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBanner({ type: 'success', text: 'System Report CSV successfully generated and downloaded.' });
  };

  // Export: System Diagnostic JSON
  const handleExportReportJSON = () => {
    if (!metrics) return;
    const reportData = {
      title: 'TeacherHub Educational System Diagnostic & Management Report',
      timestamp: new Date().toISOString(),
      generatedBy: {
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
      },
      metrics,
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        department: u.department,
        storageUsedBytes: u.storage_used,
        storageLimitBytes: u.storage_limit,
        usagePercentage: Math.min(100, Math.round((u.storage_used / (u.storage_limit || 1)) * 100)),
      })),
      recentAuditLogsCount: auditLogs.length,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `TeacherHub_Diagnostic_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBanner({ type: 'success', text: 'System Diagnostic JSON report downloaded.' });
  };

  // Export: Audit Trail CSV
  const handleExportAuditLogsCSV = () => {
    if (!auditLogs.length) return;
    const rows = [
      ['Timestamp', 'Action', 'Target Type', 'Target Name', 'User', 'Device', 'IP Address', 'Details'],
      ...auditLogs.map((log) => [
        `"${log.timestamp}"`,
        `"${log.action}"`,
        `"${log.target_type}"`,
        `"${(log.target_name || '').replace(/"/g, '""')}"`,
        `"${log.username}"`,
        `"${log.device}"`,
        `"${log.ip}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TeacherHub_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBanner({ type: 'success', text: 'Security Audit Trail exported to CSV.' });
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchUser.trim().toLowerCase();
    const matchQuery =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q));

    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchQuery && matchRole && matchStatus;
  });

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((log) => {
    const q = searchLog.trim().toLowerCase();
    const matchQuery =
      !q ||
      log.username.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.target_name.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      log.ip.toLowerCase().includes(q);

    let matchCategory = true;
    if (actionCategoryFilter === 'auth') {
      matchCategory = log.action.includes('LOGIN') || log.action.includes('LOGOUT') || log.action.includes('PASSWORD');
    } else if (actionCategoryFilter === 'file') {
      matchCategory = log.target_type === 'file' || log.action.includes('UPLOAD') || log.action.includes('RENAME') || log.action.includes('MOVE');
    } else if (actionCategoryFilter === 'admin') {
      matchCategory = log.action.includes('USER') || log.action.includes('ROLE') || log.action.includes('QUOTA') || log.action.includes('SYSTEM');
    } else if (actionCategoryFilter === 'trash') {
      matchCategory = log.action.includes('TRASH');
    }

    let matchDevice = true;
    if (deviceFilter === 'mobile') {
      matchDevice = log.device.toLowerCase().includes('mobile') || log.device.toLowerCase().includes('phone') || log.device.toLowerCase().includes('iphone') || log.device.toLowerCase().includes('android');
    } else if (deviceFilter === 'desktop') {
      matchDevice = log.device.toLowerCase().includes('desktop') || log.device.toLowerCase().includes('mac') || log.device.toLowerCase().includes('windows');
    }

    return matchQuery && matchCategory && matchDevice;
  });

  // Category counts
  const totalStoragePool = 107374182400; // 100 GB
  const totalStorageUsed = metrics?.totalStorageUsed || 0;
  const poolUsagePct = Math.min(100, Math.round((totalStorageUsed / totalStoragePool) * 100));

  // Department breakdown calculation
  const deptMap: Record<string, { count: number; users: number; storage: number }> = {};
  users.forEach((u) => {
    const d = u.department || 'General Faculty';
    if (!deptMap[d]) deptMap[d] = { count: 0, users: 0, storage: 0 };
    deptMap[d].users += 1;
    deptMap[d].storage += u.storage_used || 0;
  });

  return (
    <div className="space-y-6">
      {/* Admin Top Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border border-amber-800/50 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">System & Resource Administration</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage educational accounts, faculty storage quotas, analytical reports, and security audit ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="admin-refresh-btn"
            onClick={fetchAdminData}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh All Administrative Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            id="admin-empty-trash-btn"
            onClick={() => setEmptyTrashModalOpen(true)}
            className="px-3 py-2 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Empty System Trash"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Purge Trash</span>
          </button>

          <button
            type="button"
            id="admin-add-user-btn"
            onClick={() => setAddUserOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add New Teacher
          </button>
        </div>
      </div>

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
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
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

      {/* Admin Stats Metric Strip */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Total Accounts</div>
            <div className="text-lg font-bold text-white mt-1">{metrics.totalUsers}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Active Teachers</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{metrics.activeUsers}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Active Files</div>
            <div className="text-lg font-bold text-indigo-400 mt-1">{metrics.totalFiles}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Videos & Media</div>
            <div className="text-lg font-bold text-rose-400 mt-1">{metrics.totalVideos}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Documents</div>
            <div className="text-lg font-bold text-teal-400 mt-1">{metrics.totalDocuments}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Storage Consumed</div>
            <div className="text-lg font-bold text-amber-400 mt-1">{formatBytes(metrics.totalStorageUsed)}</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 font-medium">Today's Uploads</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">{metrics.todayUploads}</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 text-xs font-semibold overflow-x-auto pb-0.5">
        <button
          type="button"
          id="tab-btn-institution"
          onClick={() => handleSelectTab('institution')}
          className={`pb-2.5 px-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'institution'
              ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Institutional Management</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 text-[10px] text-indigo-300 border border-indigo-800/80">
            Multi-Tenant
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-users"
          onClick={() => handleSelectTab('users')}
          className={`pb-2.5 px-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {users.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-storage"
          onClick={() => handleSelectTab('storage')}
          className={`pb-2.5 px-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'storage'
              ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Storage Management</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {formatBytes(totalStorageUsed)}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-reports"
          onClick={() => handleSelectTab('reports')}
          className={`pb-2.5 px-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>System Reports</span>
        </button>

        <button
          type="button"
          id="tab-btn-security"
          onClick={() => handleSelectTab('security')}
          className={`pb-2.5 px-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Security & Logs</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {auditLogs.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-rules"
          onClick={() => handleSelectTab('rules')}
          className={`pb-2.5 px-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'rules'
              ? 'border-b-2 border-amber-500 text-amber-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Institutional Rules</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-[10px] text-amber-300 border border-amber-800 font-mono">
            Admin &amp; Multi-User
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 0: INSTITUTIONAL MANAGEMENT                       */}
      {/* ========================================================= */}
      {activeTab === 'institution' && (
        <InstitutionalManagement
          currentUser={currentUser}
          onRefresh={fetchAdminData}
        />
      )}

      {/* ========================================================= */}
      {/* SECTION 1: USER MANAGEMENT                                */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm space-y-4 p-4 sm:p-5">
          {/* Controls Bar: Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="search-user-input"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Search teachers by name, email, or department..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Role filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 hidden md:inline">Role:</span>
                <select
                  id="filter-role-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Roles</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 hidden md:inline">Status:</span>
                <select
                  id="filter-status-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchAdminData}
                className="p-2 rounded-xl bg-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Refresh user list"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* System Architecture Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-indigo-950/40 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                  <span>Institutional Governance Architecture</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 font-mono border border-amber-700/60 font-semibold flex items-center gap-1">
                    👑 Single Master Admin: pssofttech@gmail.com
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 font-semibold border border-indigo-700/60">
                    Multi-User Faculty: Admin Rights Disabled
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Exactly one Master Administrator holds sovereign oversight. All multi-user accounts operate as faculty teachers under strict permission boundaries.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-switch-to-rules-tab"
                onClick={() => handleSelectTab('rules')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-700/60 font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" /> View Rules
              </button>
              <button
                type="button"
                onClick={() => setAddUserOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Faculty Member
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-700/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-700 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Faculty Member</th>
                  <th className="py-3 px-3.5">Email Address</th>
                  <th className="py-3 px-3.5">Role</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Access Rights & Permissions</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Storage Quota</th>
                  <th className="py-3 px-3.5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-slate-800/40">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No faculty members found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const pct = Math.min(100, Math.round((u.storage_used / (u.storage_limit || 1)) * 100));
                    const isSelf = u.id === currentUser.id;
                    const isRootMasterAdmin = u.id === 'usr_pssofttech' || u.email?.toLowerCase() === 'pssofttech@gmail.com';
                    const isMasterAdmin = isRootMasterAdmin || u.role === 'admin';
                    const canDeleteUser = !isSelf && !isRootMasterAdmin;
                    const perms = u.permissions || { ...DEFAULT_TEACHER_PERMISSIONS };

                    return (
                      <tr key={u.id} className="hover:bg-slate-750/60 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 border ${
                              isMasterAdmin
                                ? 'bg-amber-600/30 text-amber-300 border-amber-500/40'
                                : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                            }`}>
                              {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{u.username}</span>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.department || 'General Faculty'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-slate-300 font-mono text-[11px]">
                          {u.email}
                        </td>

                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isMasterAdmin
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900'
                                : 'bg-slate-900 text-indigo-300 border-indigo-800/80 hover:bg-indigo-950'
                            }`}
                            title={isMasterAdmin ? 'Master Administrator (Full Institutional Access)' : 'Multi-User Faculty (Admin Rights Disabled)'}
                          >
                            {isMasterAdmin ? (
                              <>
                                <Shield className="w-3 h-3 text-amber-400" />
                                <span>MASTER ADMIN</span>
                              </>
                            ) : (
                              <>
                                <span>TEACHER</span>
                                <span className="text-[9px] text-rose-400 font-mono lowercase">no-admin</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Granular Teacher Permissions Column */}
                        <td className="py-3 px-3.5">
                          {isMasterAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-semibold">
                              <Shield className="w-3 h-3 text-amber-400" /> Full Institutional Access
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleQuickTogglePerm(u, 'can_upload')}
                                title="Click to toggle Upload permission"
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  perms.can_upload !== false
                                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                    : 'bg-rose-950/70 text-rose-300 border-rose-800 line-through hover:bg-rose-900'
                                }`}
                              >
                                Upload
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickTogglePerm(u, 'can_delete')}
                                title="Click to toggle Delete permission"
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  perms.can_delete !== false
                                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                    : 'bg-rose-950/70 text-rose-300 border-rose-800 line-through hover:bg-rose-900'
                                }`}
                              >
                                Delete
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickTogglePerm(u, 'can_share')}
                                title="Click to toggle Share permission"
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  perms.can_share !== false
                                    ? 'bg-indigo-950/70 text-indigo-300 border-indigo-700 hover:bg-indigo-900'
                                    : 'bg-rose-950/70 text-rose-300 border-rose-800 line-through hover:bg-rose-900'
                                }`}
                              >
                                Share
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickTogglePerm(u, 'can_create_folder')}
                                title="Click to toggle Folder Creation permission"
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  perms.can_create_folder !== false
                                    ? 'bg-teal-950/70 text-teal-300 border-teal-700 hover:bg-teal-900'
                                    : 'bg-rose-950/70 text-rose-300 border-rose-800 line-through hover:bg-rose-900'
                                }`}
                              >
                                Folders
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickTogglePerm(u, 'can_download')}
                                title="Click to toggle Download permission"
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  perms.can_download !== false
                                    ? 'bg-cyan-950/70 text-cyan-300 border-cyan-700 hover:bg-cyan-900'
                                    : 'bg-rose-950/70 text-rose-300 border-rose-800 line-through hover:bg-rose-900'
                                }`}
                              >
                                Download
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickTogglePerm(u, 'can_rename')}
                                title="Click to toggle Rename permission"
                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                  perms.can_rename !== false
                                    ? 'bg-amber-950/70 text-amber-300 border-amber-700 hover:bg-amber-900'
                                    : 'bg-rose-950/70 text-rose-300 border-rose-800 line-through hover:bg-rose-900'
                                }`}
                              >
                                Rename
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenPermissionsModal(u)}
                                title="Open granular access control editor for this teacher"
                                className="p-1 rounded bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors ml-0.5"
                              >
                                <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border transition-all ${
                              isSelf
                                ? 'opacity-70 cursor-not-allowed bg-emerald-950 text-emerald-400 border-emerald-800'
                                : 'cursor-pointer ' +
                                  (u.status === 'active'
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                    : 'bg-rose-950/80 text-rose-300 border-rose-700 hover:bg-rose-900')
                            }`}
                            title={isSelf ? 'Cannot suspend your own active account' : 'Click to toggle active/suspended state'}
                          >
                            {u.status}
                          </button>
                        </td>

                        <td className="py-3 px-3.5 text-slate-300">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span>{formatBytes(u.storage_used)}</span>
                              <span className="font-mono text-slate-400">
                                {formatBytes(u.storage_limit)} ({pct}%)
                              </span>
                            </div>
                            <div className="w-32 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-700">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isMasterAdmin && (
                              <button
                                type="button"
                                onClick={() => handleOpenPermissionsModal(u)}
                                className="p-1.5 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-950/70 border border-transparent hover:border-indigo-700/60 transition-colors cursor-pointer"
                                title="Manage Access Rights & Permissions"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                              title="Edit User Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenQuotaModal(u)}
                              className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 transition-colors cursor-pointer"
                              title="Adjust Storage Quota"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setResetModalUser(u)}
                              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {canDeleteUser ? (
                              <button
                                type="button"
                                id={`btn-delete-user-${u.id}`}
                                onClick={() => setDeleteModalUser(u)}
                                className="px-2 py-1.5 rounded-lg text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/60 hover:border-rose-500 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
                                title={`Delete account: ${u.username} (${u.email})`}
                                aria-label={`Delete account: ${u.username}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span className="text-[11px] font-semibold hidden md:inline">Delete</span>
                              </button>
                            ) : (
                              <div
                                className="p-1.5 rounded-lg text-slate-600 border border-slate-800/50 cursor-not-allowed flex items-center shrink-0"
                                title={isSelf ? 'Active logged-in account (Cannot delete self)' : 'Master Administrator (Protected account)'}
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-600" />
                              </div>
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
      )}

      {/* ========================================================= */}
      {/* SECTION 2: STORAGE MANAGEMENT                             */}
      {/* ========================================================= */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Central Storage Overview Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Central Storage Pool Overview
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  School-wide educational cloud capacity and disk space allocations
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    LocalStore.recalculateStorage();
                    await fetchAdminData();
                    setBanner({ type: 'success', text: 'Storage calculations synchronized with repository files.' });
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Recalculate Quotas
                </button>

                <button
                  type="button"
                  onClick={() => setEmptyTrashModalOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Empty All System Trash
                </button>
              </div>
            </div>

            {/* Storage Metric Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                <div className="text-[11px] text-slate-400 font-medium">Total Storage Capacity</div>
                <div className="text-xl font-bold text-white">{formatBytes(totalStoragePool)}</div>
                <div className="text-[11px] text-slate-400">Institutional Server Quota</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                <div className="text-[11px] text-slate-400 font-medium">Consumed Storage</div>
                <div className="text-xl font-bold text-indigo-400">{formatBytes(totalStorageUsed)}</div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${poolUsagePct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    style={{ width: `${poolUsagePct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">{poolUsagePct}% utilized across all teachers</div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-2">
                <div className="text-[11px] text-slate-400 font-medium">Pending Trashed Disk Space</div>
                <div className="text-xl font-bold text-rose-400">{formatBytes(metrics?.trashedSize || 0)}</div>
                <div className="text-[11px] text-slate-400">
                  {metrics?.trashedCount || 0} file(s) waiting for permanent purge
                </div>
              </div>
            </div>
          </div>

          {/* Quota Management Per Faculty Member */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Faculty Quota Allocations</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust storage limits, view consumption, and purge individual teacher trash buffers
              </p>
            </div>

            <div className="divide-y divide-slate-700/50">
              {users.map((u) => {
                const pct = Math.min(100, Math.round((u.storage_used / (u.storage_limit || 1)) * 100));
                const isCritical = pct >= 90;
                const isWarning = pct >= 70 && pct < 90;

                return (
                  <div key={u.id} className="py-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{u.username}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({u.email})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                            {u.department || 'General Faculty'}
                          </span>
                          {isCritical && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-semibold animate-pulse">
                              90%+ Critical
                            </span>
                          )}
                          {isWarning && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-semibold">
                              70%+ Warning
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-300 text-xs">
                          {formatBytes(u.storage_used)} / {formatBytes(u.storage_limit)} ({pct}%)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenQuotaModal(u)}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Sliders className="w-3 h-3 text-indigo-400" />
                            <span>Adjust Quota</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEmptyUserTrash(u.id, u.username)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Empty trash for this teacher"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Purge Trash</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 3: SYSTEM REPORTS                                 */}
      {/* ========================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Export and Action Header */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Educational Analytics & System Reporting
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate formal compliance reports, inspect curricular resource distribution, and export data
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                id="export-report-csv-btn"
                onClick={handleExportReportCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV Report
              </button>

              <button
                type="button"
                id="export-report-json-btn"
                onClick={handleExportReportJSON}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Diagnostic JSON
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Curriculum Category Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{metrics?.totalVideos ?? 0}</div>
                <div className="text-xs text-slate-400">Lesson Videos Uploaded</div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{metrics?.totalDocuments ?? 0}</div>
                <div className="text-xs text-slate-400">PDF & Worksheets</div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{metrics?.totalAudio ?? 0}</div>
                <div className="text-xs text-slate-400">Audio Lectures & Pronunciation</div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{metrics?.totalImages ?? 0}</div>
                <div className="text-xs text-slate-400">Educational Diagrams</div>
              </div>
            </div>
          </div>

          {/* Departmental Resource Distribution */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Departmental Storage & Curricula Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Resource consumption indexed by academic department</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-700/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-700 font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Academic Department</th>
                    <th className="py-3 px-3.5">Teachers Assigned</th>
                    <th className="py-3 px-3.5">Total Storage Consumed</th>
                    <th className="py-3 px-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/40">
                  {Object.entries(deptMap).map(([dept, data]) => (
                    <tr key={dept} className="hover:bg-slate-750/60 transition-colors">
                      <td className="py-3 px-3.5 font-semibold text-white">{dept}</td>
                      <td className="py-3 px-3.5 text-slate-300">{data.users} Faculty Member(s)</td>
                      <td className="py-3 px-3.5 text-amber-400 font-mono">{formatBytes(data.storage)}</td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                          Operational
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 4: SECURITY & LOGS                                */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Health Status Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Security Health & Audit Ledger
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tracks cross-device mobile uploads, desktop logins, credential modifications, and administrator events.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  id="export-audit-csv-btn"
                  onClick={handleExportAuditLogsCSV}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Audit Trail (CSV)
                </button>

                <button
                  type="button"
                  onClick={handleSimulateSecurityEvent}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" /> Test Security Check
                </button>

                <button
                  type="button"
                  onClick={() => setArchiveLogsModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Archive Logs
                </button>
              </div>
            </div>

            {/* Security Indicator Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div className="text-[11px] text-slate-400">Authentication Protocol</div>
                <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Active Session Token
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div className="text-[11px] text-slate-400">Multi-Device Sync</div>
                <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Mobile & Desktop Sync
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div className="text-[11px] text-slate-400">Active Administrators</div>
                <div className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> {users.filter((u) => u.role === 'admin').length} Authorized
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div className="text-[11px] text-slate-400">Suspended Accounts</div>
                <div className="text-xs font-bold text-slate-200 mt-1">
                  {users.filter((u) => u.status === 'suspended').length} Suspended
                </div>
              </div>
            </div>
          </div>

          {/* Audit Logs Filter & Table */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="search-log-input"
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  placeholder="Filter logs by user, action, target file, or IP..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <select
                  value={actionCategoryFilter}
                  onChange={(e) => setActionCategoryFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Actions</option>
                  <option value="auth">Logins & Auth</option>
                  <option value="file">File Operations</option>
                  <option value="admin">Admin Actions</option>
                  <option value="trash">Trash Operations</option>
                </select>

                <select
                  value={deviceFilter}
                  onChange={(e) => setDeviceFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Devices</option>
                  <option value="mobile">Mobile Devices</option>
                  <option value="desktop">Desktop Workstations</option>
                </select>
              </div>
            </div>

            {/* Log Entries List */}
            <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No security audit logs found matching your filter criteria.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isAuth = log.action.includes('LOGIN') || log.action.includes('PASSWORD');
                  const isDelete = log.action.includes('DELETE') || log.action.includes('TRASH');
                  const isCreate = log.action.includes('CREATE') || log.action.includes('UPLOAD');
                  const isRole = log.action.includes('ROLE') || log.action.includes('STATUS') || log.action.includes('QUOTA');

                  return (
                    <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs hover:bg-slate-750/30 px-2 rounded-xl transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="font-semibold text-slate-200 flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              isDelete
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : isCreate
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isRole
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-slate-900 text-indigo-400 border border-indigo-800'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-white truncate">{log.target_name}</span>
                        </div>

                        {log.details && (
                          <div className="text-[11px] text-slate-400 leading-relaxed">
                            {log.details}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-300">By: {log.username}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            {log.device.toLowerCase().includes('mobile') || log.device.toLowerCase().includes('phone') ? (
                              <Smartphone className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Laptop className="w-3 h-3 text-blue-400" />
                            )}
                            {log.device}
                          </span>
                          <span>&bull;</span>
                          <span className="font-mono text-[10px] text-slate-400">IP: {log.ip}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0 pt-1 font-mono">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 5: INSTITUTIONAL RULES & GOVERNANCE                */}
      {/* ========================================================= */}
      {activeTab === 'rules' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Institutional Governance &amp; Security Rules</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      ACTIVE_ENFORCED
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Separate cryptographic policies enforced for the Single Master Administrator vs. Multi-User Faculty (Teachers).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-amber-950/70 text-amber-300 border border-amber-800 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> 1 Master Admin
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-indigo-950/70 text-indigo-300 border border-indigo-800 font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Multi-User Teachers (Admin Rights Disabled)
                </span>
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Sole Sovereign Authority</div>
                  <div className="text-[11px] text-slate-400">
                    <code className="text-amber-300 font-mono">pssofttech@gmail.com</code> is the singular root admin. Cannot be duplicated or demoted.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Disabled Admin Rights</div>
                  <div className="text-[11px] text-slate-400">
                    Faculty accounts strictly run in Teacher role with 15 GB quota and no permission elevation.
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-200">Continuous Security Ledger</div>
                  <div className="text-[11px] text-slate-400">
                    Cross-device operations (PC, Android, iOS) are verified against the institutional rules matrix.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Rules Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Administrator Rules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    👑
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Administrator Rules</h3>
                    <p className="text-[11px] text-amber-400">Single Master Admin Sovereignty</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                  {ADMIN_RULES.length} Active Rules
                </span>
              </div>

              <div className="space-y-3">
                {ADMIN_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-slate-800/80 border border-amber-500/25 hover:border-amber-500/50 transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/70">
                            {rule.code}
                          </span>
                          <span className="text-xs font-bold text-white">{rule.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Category: {rule.category}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <Check className="w-3 h-3" /> Enforced
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rule.description}
                    </p>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span><strong>Enforcement:</strong> {rule.enforcementMechanism}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Multi-User Faculty Rules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    👥
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Multi-User Account Rules</h3>
                    <p className="text-[11px] text-indigo-400">Faculty Members &bull; Admin Rights Disabled</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  {MULTI_USER_RULES.length} Active Rules
                </span>
              </div>

              <div className="space-y-3">
                {MULTI_USER_RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-slate-800/80 border border-indigo-500/25 hover:border-indigo-500/50 transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-indigo-400 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/70">
                            {rule.code}
                          </span>
                          <span className="text-xs font-bold text-white">{rule.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Category: {rule.category}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <Check className="w-3 h-3" /> Enforced
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rule.description}
                    </p>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Lock className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span><strong>Enforcement:</strong> {rule.enforcementMechanism}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>Institutional Permissions &amp; Authority Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct side-by-side comparison of capabilities across account classes.
                </p>
              </div>
              <span className="text-[11px] font-mono text-amber-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                Cryptographic Policy Enforced
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-300 uppercase text-[10px] border-b border-slate-700 font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">System Capability / Domain</th>
                    <th className="py-3 px-4 text-amber-400">👑 Single Master Admin (pssofttech)</th>
                    <th className="py-3 px-4 text-indigo-400">👥 Multi-User Teacher Accounts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-slate-850/40">
                  <tr className="hover:bg-slate-800/60">
                    <td className="py-3 px-4 font-semibold text-white">System Administration Access</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Full Sovereign Control
                    </td>
                    <td className="py-3 px-4 text-rose-400 font-semibold">
                      ✕ Strictly Barred (No Admin Rights)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/60">
                    <td className="py-3 px-4 font-semibold text-white">Default Storage Quota</td>
                    <td className="py-3 px-4 text-amber-300 font-mono">100 GB Master Pool</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">15 GB Isolated Personal Quota</td>
                  </tr>
                  <tr className="hover:bg-slate-800/60">
                    <td className="py-3 px-4 font-semibold text-white">Adjust Faculty Quotas</td>
                    <td className="py-3 px-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Unrestricted Adjustment Authority
                    </td>
                    <td className="py-3 px-4 text-slate-500">✕ None</td>
                  </tr>
                  <tr className="hover:bg-slate-800/60">
                    <td className="py-3 px-4 font-semibold text-white">Toggle Access Rights (Upload, Delete, Share)</td>
                    <td className="py-3 px-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Exclusive Discretion
                    </td>
                    <td className="py-3 px-4 text-slate-500">✕ Subject to Admin Governance</td>
                  </tr>
                  <tr className="hover:bg-slate-800/60">
                    <td className="py-3 px-4 font-semibold text-white">Global Security Audit Stream</td>
                    <td className="py-3 px-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Full Inspection &amp; Export
                    </td>
                    <td className="py-3 px-4 text-slate-500">✕ No Access</td>
                  </tr>
                  <tr className="hover:bg-slate-800/60">
                    <td className="py-3 px-4 font-semibold text-white">Cross-Department Supervision</td>
                    <td className="py-3 px-4 text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Institutional Resource Supervision
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      Isolated to Own Files &amp; Explicitly Shared Assets
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Add User Modal */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Add Faculty or Administrator Account
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure institutional role, department, storage quota, and access privileges.
                </p>
              </div>
              <button onClick={() => setAddUserOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. sarah_prof"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. sarah@teacherhub.edu"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter login password"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="e.g. Science, Mathematics, CS"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assigned Role <span className="text-[10px] text-amber-400 font-mono">(Single Admin Policy)</span>
                  </label>
                  <select
                    value="teacher"
                    disabled
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-indigo-300 cursor-not-allowed opacity-90"
                  >
                    <option value="teacher">Teacher (Multi-User Faculty - No Admin Rights)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Rule RULE_ADM_02: Multi-user accounts cannot be granted administrator rights.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Storage Quota (GB)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newQuotaGB}
                    onChange={(e) => setNewQuotaGB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default: 15 GB (Rule RULE_USR_04)</p>
                </div>
              </div>

                {/* Initial Teacher Permissions Configurator */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      Configure Initial Access Rights &amp; Permissions
                    </label>
                    <span className="text-[10px] text-slate-400">Can be adjusted at any time</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={newPermissions.can_upload !== false}
                        onChange={(e) => setNewPermissions((prev) => ({ ...prev, can_upload: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Upload Files</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={newPermissions.can_delete !== false}
                        onChange={(e) => setNewPermissions((prev) => ({ ...prev, can_delete: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Delete Files</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={newPermissions.can_share !== false}
                        onChange={(e) => setNewPermissions((prev) => ({ ...prev, can_share: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Share Resources</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={newPermissions.can_create_folder !== false}
                        onChange={(e) => setNewPermissions((prev) => ({ ...prev, can_create_folder: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Create Folders</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={newPermissions.can_download !== false}
                        onChange={(e) => setNewPermissions((prev) => ({ ...prev, can_download: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Download Files</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={newPermissions.can_rename !== false}
                        onChange={(e) => setNewPermissions((prev) => ({ ...prev, can_rename: e.target.checked }))}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span>Rename Items</span>
                    </label>
                  </div>
                </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm"
                >
                  {newRole === 'admin' ? 'Create Administrator Account' : 'Create Teacher Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit User Modal */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Edit Profile: {editModalUser.username}
              </h3>
              <button onClick={() => setEditModalUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role Architecture</label>
                  <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                    {editModalUser.role === 'admin' ||
                    editModalUser.id === 'usr_pssofttech' ||
                    editModalUser.email === 'pssofttech@gmail.com' ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Administrator
                      </span>
                    ) : (
                      <span className="text-indigo-300">Teacher (Faculty)</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quota Limit (GB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editQuotaGB}
                    onChange={(e) => setEditQuotaGB(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {editModalUser.role === 'teacher' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = editModalUser;
                      setEditModalUser(null);
                      handleOpenPermissionsModal(target);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Configure Access Rights & Permissions
                  </button>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                {editModalUser.id !== currentUser.id &&
                editModalUser.id !== 'usr_pssofttech' &&
                editModalUser.email?.toLowerCase() !== 'pssofttech@gmail.com' ? (
                  <button
                    type="button"
                    id="btn-modal-delete-user"
                    onClick={() => {
                      const target = editModalUser;
                      setEditModalUser(null);
                      setDeleteModalUser(target);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/60 hover:border-rose-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Delete this user account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2.5. Dedicated Teacher Access Rights & Permissions Modal */}
      {permissionsModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm">
                  {permissionsModalUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                    Teacher Access Rights: {permissionsModalUser.username}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Email: <span className="font-mono text-slate-300">{permissionsModalUser.email}</span> &bull; {permissionsModalUser.department || 'Faculty'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionsModalUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer text-base p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Quick Security Presets:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('full')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-semibold text-center transition-colors cursor-pointer hover:border-indigo-500"
                >
                  ⚡ Full Access
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('standard')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-semibold text-center transition-colors cursor-pointer hover:border-indigo-500"
                  title="All permissions allowed except file deletion"
                >
                  📚 Standard
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('readonly')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-semibold text-center transition-colors cursor-pointer hover:border-indigo-500"
                  title="Download and share allowed, no modifications"
                >
                  👁️ Read-Only
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPermissionPreset('restricted')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-semibold text-center transition-colors cursor-pointer hover:border-indigo-500"
                  title="Upload and download only"
                >
                  📤 Submitter
                </button>
              </div>
            </div>

            {/* Granular Permission Toggles */}
            <form onSubmit={handleSavePermissions} className="space-y-3">
              <div className="space-y-2">
                {/* 1. Upload */}
                <div className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  editPermissions.can_upload !== false
                    ? 'bg-slate-800/80 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-700/60 opacity-80'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      File & Assignment Uploading
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Allows this teacher to upload course materials, video lessons, audio, and documents.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPermissions((prev) => ({ ...prev, can_upload: prev.can_upload === false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editPermissions.can_upload !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {editPermissions.can_upload !== false ? 'ALLOWED' : 'DISABLED'}
                  </button>
                </div>

                {/* 2. Delete */}
                <div className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  editPermissions.can_delete !== false
                    ? 'bg-slate-800/80 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-700/60 opacity-80'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      File Deletion & Trash Operations
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Allows moving files to trash or permanently deleting educational resources.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPermissions((prev) => ({ ...prev, can_delete: prev.can_delete === false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editPermissions.can_delete !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {editPermissions.can_delete !== false ? 'ALLOWED' : 'DISABLED'}
                  </button>
                </div>

                {/* 3. Share */}
                <div className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  editPermissions.can_share !== false
                    ? 'bg-slate-800/80 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-700/60 opacity-80'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                      Resource Sharing & Collaboration
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Allows sharing course items across the institutional faculty or generating public links.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPermissions((prev) => ({ ...prev, can_share: prev.can_share === false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editPermissions.can_share !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {editPermissions.can_share !== false ? 'ALLOWED' : 'DISABLED'}
                  </button>
                </div>

                {/* 4. Folders */}
                <div className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  editPermissions.can_create_folder !== false
                    ? 'bg-slate-800/80 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-700/60 opacity-80'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-teal-400" />
                      Folder Directory Creation
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Allows creating and organizing subject/curriculum folder structures.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPermissions((prev) => ({ ...prev, can_create_folder: prev.can_create_folder === false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editPermissions.can_create_folder !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {editPermissions.can_create_folder !== false ? 'ALLOWED' : 'DISABLED'}
                  </button>
                </div>

                {/* 5. Download */}
                <div className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  editPermissions.can_download !== false
                    ? 'bg-slate-800/80 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-700/60 opacity-80'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      Resource Download & Offline Cache
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Allows downloading files to local computer or saving for offline classroom projection.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPermissions((prev) => ({ ...prev, can_download: prev.can_download === false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editPermissions.can_download !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {editPermissions.can_download !== false ? 'ALLOWED' : 'DISABLED'}
                  </button>
                </div>

                {/* 6. Rename */}
                <div className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                  editPermissions.can_rename !== false
                    ? 'bg-slate-800/80 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-700/60 opacity-80'
                }`}>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      Item Renaming Rights
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Allows renaming uploaded lesson files, folders, and teaching resources.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPermissions((prev) => ({ ...prev, can_rename: prev.can_rename === false }))}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      editPermissions.can_rename !== false
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {editPermissions.can_rename !== false ? 'ALLOWED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPermissionsModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Access Rights
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Reset Password: {resetModalUser.username}
              </h3>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Security Password</label>
                <input
                  type="password"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Adjust Quota Modal */}
      {quotaModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Adjust Storage Quota: {quotaModalUser.username}
              </h3>
              <button onClick={() => setQuotaModalUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="space-y-4">
              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Currently using <span className="font-semibold text-white">{formatBytes(quotaModalUser.storage_used)}</span>. Select a preset or enter a custom allocation:
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[10, 15, 25, 50].map((gb) => (
                    <button
                      key={gb}
                      type="button"
                      onClick={() => setQuotaValGB(gb)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        quotaValGB === gb
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {gb} GB
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Quota Allocation (GB)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  required
                  value={quotaValGB}
                  onChange={(e) => setQuotaValGB(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuotaModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Update Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete User Confirmation Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-base">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div>Permanently Delete Account</div>
                <div className="text-[10px] text-rose-400/80 font-normal uppercase tracking-wider">Irreversible Action</div>
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-200 space-y-1">
              <p className="font-semibold text-white">
                Are you sure you want to permanently delete this user account?
              </p>
              <div className="text-[11px] text-slate-300 space-y-0.5 pt-1">
                <div>&bull; <strong className="text-white">Username:</strong> {deleteModalUser.username}</div>
                <div>&bull; <strong className="text-white">Email:</strong> {deleteModalUser.email}</div>
                <div>&bull; <strong className="text-white">Department:</strong> {deleteModalUser.department || 'Faculty'}</div>
                <div>&bull; <strong className="text-white">Role:</strong> {deleteModalUser.role}</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This action will immediately and permanently delete this account, its login credentials, and all uploaded files and folders. This cannot be undone.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-user-permanently"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 disabled:opacity-60 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Permanently Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Empty System Trash Confirmation Modal */}
      {emptyTrashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Purge All System Trash</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will permanently purge all <span className="font-semibold text-white">{metrics?.trashedCount || 0}</span> trashed file(s) across all faculty accounts, freeing up <span className="font-semibold text-white">{formatBytes(metrics?.trashedSize || 0)}</span> of storage space. This cannot be undone.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEmptyTrashModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmptySystemTrash}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Purge System Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Archive Logs Modal */}
      {archiveLogsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>Archive Audit Trail Logs</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Before clearing logs, ensure you have exported the current audit trail to CSV. This will archive current historical entries and initialize a clean verification ledger.
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setArchiveLogsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveLogs}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
