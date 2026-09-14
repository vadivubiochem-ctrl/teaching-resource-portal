import React, { useState, useEffect } from 'react';
import {
  Home,
  FolderOpen,
  Video,
  Music,
  FileText,
  Image as ImageIcon,
  FolderTree,
  Upload,
  Share2,
  Star,
  Clock,
  Trash2,
  Settings,
  Users,
  HardDrive,
  BarChart3,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Cloud,
  Building2,
  Info,
} from 'lucide-react';
import type { User } from '../types.js';
import { formatBytes } from '../utils/formatters.js';
import { syncManager, type SyncBroadcastMessage } from '../utils/syncManager.js';

export type NavTab =
  | 'dashboard'
  | 'my-resources'
  | 'videos'
  | 'audio'
  | 'documents'
  | 'images'
  | 'folders'
  | 'upload'
  | 'shared'
  | 'favorites'
  | 'recent'
  | 'recent-activity'
  | 'storage-analytics'
  | 'trash'
  | 'settings'
  | 'about'
  | 'admin-institution'
  | 'admin-users'
  | 'admin-storage'
  | 'admin-reports'
  | 'admin-security';

interface SidebarProps {
  currentTab: string;
  onSelectTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  user?: User | null;
  userRole?: string;
  onOpenUploadModal?: () => void;
  onOpenUpload?: () => void;
  storageUsed?: number;
  storageLimit?: number;
  isOpenMobile?: boolean;
  isOpen?: boolean;
  onCloseMobile?: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onNavigate,
  user,
  userRole,
  onOpenUploadModal,
  onOpenUpload,
  storageUsed,
  storageLimit,
  isOpenMobile,
  isOpen,
  onCloseMobile,
  onClose,
}) => {
  const isAdmin = user?.role === 'admin' || userRole === 'admin';
  const effectiveUsed = storageUsed ?? user?.storage_used ?? 0;
  const effectiveLimit = storageLimit ?? user?.storage_limit ?? 16106127360;
  const storagePercentage = Math.min(100, Math.round((effectiveUsed / (effectiveLimit || 1)) * 100));
  const isMobileOpen = isOpenMobile ?? isOpen ?? false;
  const handleClose = onCloseMobile || onClose;
  const handleUpload = onOpenUploadModal || onOpenUpload;

  // Visual Sync-Status Indicator: listens to syncManager's activity
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    // Subscribe to status updates ('Syncing...' vs idle)
    const unsubStatus = syncManager.subscribeStatus((syncing) => {
      setIsSyncing(syncing);
      if (!syncing) {
        setLastSyncTime(new Date());
      }
    });

    // Also listen to incoming sync events from other windows/tabs
    const unsubEvents = syncManager.subscribe((msg: SyncBroadcastMessage) => {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        setIsSyncing(false);
        setLastSyncTime(new Date());
      }, 1000);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, []);

  const mainNavItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'my-resources', label: 'My Resources', icon: FolderOpen },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'folders', label: 'Folders', icon: FolderTree },
    { id: 'shared', label: 'Shared With Me', icon: Share2 },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'recent-activity', label: 'Recent Activity', icon: History },
    { id: 'storage-analytics', label: 'Storage Analytics', icon: BarChart3 },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  const adminNavItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'admin-institution', label: 'Institutional Management', icon: Building2 },
    { id: 'admin-users', label: 'User Management', icon: Users },
    { id: 'admin-storage', label: 'Storage Management', icon: HardDrive },
    { id: 'admin-reports', label: 'System Reports', icon: BarChart3 },
    { id: 'admin-security', label: 'Security & Logs', icon: ShieldAlert },
  ];

  const handleNavClick = (tab: NavTab) => {
    if (onSelectTab) onSelectTab(tab);
    if (onNavigate) onNavigate(tab);
    if (handleClose) handleClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto px-3 py-4 space-y-5">
          {/* Quick Upload Primary CTA */}
          <div className="px-1 space-y-2.5">
            <button
              type="button"
              id="sidebar-upload-btn"
              onClick={() => {
                if (handleUpload) handleUpload();
                if (handleClose) handleClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Resource</span>
            </button>

            {/* Visual Sync-Status Indicator listening to syncManager's activity */}
            <div
              id="sidebar-sync-status-indicator"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all duration-300 ${
                isSyncing
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}
              title={
                isSyncing
                  ? 'Synchronizing repository changes across tabs and cloud...'
                  : `All repository files and folders are fresh (Last synced: ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`
              }
            >
              <div className="flex items-center gap-2 min-w-0">
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="font-medium truncate">
                  {isSyncing ? 'Syncing...' : 'Cloud Updated'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 pl-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-amber-400' : 'text-emerald-400/80'}`} />
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div>
            <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Teaching Hub
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation Section - Only visible to Master Administrator */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-800">
              <div className="px-3 text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Administration</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-mono">
                  Admin
                </span>
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400/80'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Storage Meter Card at bottom */}
          <div className="mt-auto px-1 pt-4">
            <div className={`rounded-xl p-3 shadow-inner transition-colors ${
              storagePercentage >= 90
                ? 'bg-rose-950/40 border border-rose-600/70 ring-1 ring-rose-500/50'
                : 'bg-slate-800/80 border border-slate-700/80'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <HardDrive className={`w-3.5 h-3.5 ${storagePercentage >= 90 ? 'text-rose-400' : 'text-indigo-400'}`} />
                  Cloud Storage
                </span>
                <span className={`text-[11px] font-bold ${
                  storagePercentage >= 90 ? 'text-rose-400 animate-pulse' : 'text-indigo-300'
                }`}>
                  {storagePercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storagePercentage >= 90
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                      : storagePercentage > 60
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Used: {formatBytes(effectiveUsed)}</span>
                <span>Limit: {formatBytes(effectiveLimit)}</span>
              </div>

              {/* Visual Warning when storage usage exceeds 90% */}
              {storagePercentage >= 90 && (
                <div className="mt-2.5 p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[11px] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                    <span>Quota Critical ({storagePercentage}%)</span>
                  </div>
                  <p className="text-[10px] text-rose-300/90 leading-tight">
                    You have exceeded 90% of your allocated storage quota. Please clean up files proactively to prevent upload failures.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectTab && onSelectTab('trash')}
                    className="w-full mt-1 py-1 px-2 text-center text-[10px] font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md transition-colors cursor-pointer"
                  >
                    Clean Up & Empty Trash
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
