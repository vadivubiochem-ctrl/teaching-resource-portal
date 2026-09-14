import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Upload,
  RefreshCw,
  Search,
  HardDrive,
  User as UserIcon,
  ShieldAlert,
  WifiOff,
  DownloadCloud,
  Layers,
  AlertTriangle,
  Sparkles,
  Scale,
} from 'lucide-react';
import type { User, TeachingFile, Folder as FolderType, SystemStats } from './types.js';
import { api, getSimulatedDevice, setSimulatedDevice } from './services/api.js';
import { LocalStore } from './services/store.js';
import { AuthPage } from './components/AuthPage.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardOverview } from './components/DashboardOverview.js';
import { FileManager } from './components/FileManager.js';
import { UniversalPreviewModal } from './components/UniversalPreviewModal.js';
import { RecentActivityView } from './components/RecentActivityView.js';
import { UploadModal } from './components/UploadModal.js';
import { FileInfoModal } from './components/FileInfoModal.js';
import { FolderModal } from './components/FolderModal.js';
import { ShareModal } from './components/ShareModal.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { InstitutionalRulesModal } from './components/InstitutionalRulesModal.js';
import { CrossDeviceModal } from './components/CrossDeviceModal.js';
import { MobileBottomNav } from './components/MobileBottomNav.js';
import { FooterSyncStatus } from './components/FooterSyncStatus.js';
import { AboutView } from './components/AboutView.js';
import { formatBytes } from './utils/formatters.js';
import { downloadTeachingFile } from './utils/fileDownloader.js';
import { useOnlineStatus } from './utils/useOnlineStatus.js';
import { usePWAInstall } from './utils/usePWAInstall.js';
import { cacheFileMetadata, getCachedFiles } from './services/offlineStorage.js';
import { syncManager } from './utils/syncManager.js';
import { onlineDb } from './services/firebase.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // App navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Offline and PWA state
  const isOnline = useOnlineStatus();
  const { isInstallable, install: installPWA } = usePWAInstall();

  // Data states
  const [files, setFiles] = useState<TeachingFile[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Simulated device state
  const [currentDevice, setCurrentDevice] = useState<string>(getSimulatedDevice());

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [previewFile, setPreviewFile] = useState<TeachingFile | null>(null);
  const [infoModalFile, setInfoModalFile] = useState<TeachingFile | null>(null);
  const [shareModalFile, setShareModalFile] = useState<TeachingFile | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [crossDeviceModalOpen, setCrossDeviceModalOpen] = useState(false);

  // Rename prompt state
  const [renameModalFile, setRenameModalFile] = useState<TeachingFile | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Move prompt state
  const [moveModalFile, setMoveModalFile] = useState<TeachingFile | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>('root');

  // Notifications
  const [toast, setToast] = useState<{ id: string; text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ id: String(Date.now()), text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Auth bootstrap: Always show main login panel when running the project
  useEffect(() => {
    LocalStore.clearSession();
    setCurrentUser(null);
    setLoadingAuth(false);
  }, []);

  // Fetch Repository Data with IndexedDB caching
  const loadRepositoryData = useCallback(async () => {
    if (!currentUser) return;
    setLoadingData(true);
    syncManager.setSyncing(true);
    try {
      const [filesRes, foldersRes, statsRes] = await Promise.all([
        api.getFiles({
          search: searchQuery.trim() || undefined,
          trash: activeTab === 'trash',
          favorite: activeTab === 'favorites' ? true : undefined,
          recent: activeTab === 'recent' ? true : undefined,
        }),
        api.getFolders(),
        api.getStats(),
      ]);

      setFiles(filesRes.files);
      setFolders(foldersRes.folders);
      setStats(statsRes);

      // Cache file records in IndexedDB for seamless offline browsing
      await cacheFileMetadata(filesRes.files);
    } catch (err: any) {
      console.warn('Network request failed, retrieving cached data from IndexedDB:', err);
      const cached = await getCachedFiles();
      if (cached && cached.length > 0) {
        setFiles(cached);
        showToast('Viewing offline cached resources from IndexedDB', 'info');
      }
    } finally {
      setLoadingData(false);
      // Give a brief smooth moment before switching back to 'Cloud Updated'
      setTimeout(() => {
        syncManager.setSyncing(false);
        setLastSyncTime(new Date());
      }, 400);
    }
  }, [currentUser, searchQuery, activeTab]);

  useEffect(() => {
    if (currentUser) {
      loadRepositoryData();
    }
  }, [currentUser, loadRepositoryData]);

  // Subscribe to syncManager status (Syncing vs idle)
  useEffect(() => {
    const unsub = syncManager.subscribeStatus((syncing) => {
      setIsSyncing(syncing);
      if (!syncing) {
        setLastSyncTime(new Date());
      }
    });
    return () => unsub();
  }, []);

  // Listen for 'file-updated' BroadcastChannel events across all open browser windows/tabs
  useEffect(() => {
    const unsubscribe = syncManager.subscribe((msg) => {
      console.log('[syncManager] Received event from another window/tab:', msg.event);
      if (currentUser) {
        setLastSyncTime(new Date());
        loadRepositoryData();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [currentUser, loadRepositoryData]);

  // Real-time Cloud Database Synchronization (Firestore): Instant sharing between Mobile and Desktop devices
  // Updates 'Last Synced' timestamp whenever Firestore triggers a real-time data refresh
  useEffect(() => {
    if (!currentUser) return;
    const unsubFiles = onlineDb.subscribeFiles((cloudFiles) => {
      if (cloudFiles && cloudFiles.length > 0) {
        console.log('[Firestore] Real-time files update from cloud, updating last sync timestamp');
        setLastSyncTime(new Date());
        loadRepositoryData();
      }
    });
    const unsubFolders = onlineDb.subscribeFolders((cloudFolders) => {
      if (cloudFolders && cloudFolders.length > 0) {
        console.log('[Firestore] Real-time folders update from cloud, updating last sync timestamp');
        setLastSyncTime(new Date());
        loadRepositoryData();
      }
    });
    return () => {
      unsubFiles();
      unsubFolders();
    };
  }, [currentUser, loadRepositoryData]);

  // Storage Quota Monitoring: Detect when user's storage exceeds 90%
  const effectiveStorageUsed = stats?.totalStorageUsed ?? currentUser?.storage_used ?? 0;
  const effectiveStorageLimit = stats?.storageLimit ?? currentUser?.storage_limit ?? 16106127360;
  const storagePercentage = Math.min(100, Math.round((effectiveStorageUsed / (effectiveStorageLimit || 1)) * 100));
  const isStorageCritical = storagePercentage >= 90;
  const storageWarnedRef = useRef<boolean>(false);

  useEffect(() => {
    if (currentUser && stats) {
      const used = stats.totalStorageUsed ?? currentUser.storage_used ?? 0;
      const limit = stats.storageLimit ?? currentUser.storage_limit ?? 16106127360;
      const pct = Math.round((used / (limit || 1)) * 100);
      if (pct >= 90 && !storageWarnedRef.current) {
        storageWarnedRef.current = true;
        showToast(
          `⚠️ Storage Quota Alert: You have exceeded 90% of your allocated cloud storage (${pct}% used). Please manage files proactively!`,
          'error'
        );
      } else if (pct < 90) {
        storageWarnedRef.current = false;
      }
    }
  }, [stats, currentUser]);

  // Handle device change
  const handleDeviceChange = (newDevice: string) => {
    setSimulatedDevice(newDevice);
    setCurrentDevice(newDevice);
    showToast(`Device switched to: ${newDevice}`, 'info');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    showToast(`Welcome back, ${user.username}!`, 'success');
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Unified File Preview
  const handlePreviewFile = (file: TeachingFile) => {
    setPreviewFile(file);
  };

  // Reliable Universal Download
  const handleDownloadFile = async (file: TeachingFile) => {
    showToast(`Preparing download: ${file.file_name}`, 'info');
    await downloadTeachingFile(file);
  };

  // Toggle favorite
  const handleToggleFavorite = async (file: TeachingFile) => {
    const newFav = !file.is_favorite;
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, is_favorite: newFav } : f))
    );
    try {
      await api.updateFile(file.id, { is_favorite: newFav });
      showToast(newFav ? 'Added to favorites' : 'Removed from favorites', 'info');
      syncManager.emit('file-updated', { fileId: file.id, type: 'favorite' });
    } catch (err) {
      loadRepositoryData();
    }
  };

  // Rename
  const handleStartRename = (file: TeachingFile) => {
    setRenameModalFile(file);
    setRenameValue(file.file_name);
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModalFile || !renameValue.trim()) return;

    try {
      await api.updateFile(renameModalFile.id, { file_name: renameValue.trim() });
      showToast(`Renamed to "${renameValue.trim()}"`, 'success');
      setRenameModalFile(null);
      syncManager.emit('file-updated', { fileId: renameModalFile.id, type: 'rename' });
      loadRepositoryData();
    } catch (err: any) {
      showToast(err.message || 'Failed to rename', 'error');
    }
  };

  // Move
  const handleStartMove = (file: TeachingFile) => {
    setMoveModalFile(file);
    setMoveTargetFolderId(file.folder_id || 'root');
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveModalFile) return;

    const targetFolder = moveTargetFolderId === 'root' ? null : moveTargetFolderId;
    try {
      await api.updateFile(moveModalFile.id, { folder_id: targetFolder as any });
      showToast(`Resource moved successfully`, 'success');
      setMoveModalFile(null);
      syncManager.emit('file-updated', { fileId: moveModalFile.id, type: 'move' });
      loadRepositoryData();
    } catch (err: any) {
      showToast(err.message || 'Failed to move', 'error');
    }
  };

  // Duplicate / Copy
  const handleCopyFile = async (file: TeachingFile) => {
    try {
      const res = await api.copyFile(file.id);
      showToast(`Created copy: ${res.file.file_name}`, 'success');
      syncManager.emit('file-updated', { fileId: res.file.id, type: 'copy' });
      loadRepositoryData();
    } catch (err: any) {
      showToast(err.message || 'Failed to copy', 'error');
    }
  };

  // Delete single file
  const handleDeleteFile = async (file: TeachingFile, permanent = false) => {
    if (permanent && !window.confirm(`Permanently delete "${file.file_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteFile(file.id, permanent);
      showToast(permanent ? 'File permanently deleted' : 'Moved to Trash', 'info');
      if (previewFile?.id === file.id) setPreviewFile(null);
      syncManager.emit('file-updated', { fileId: file.id, type: 'delete' });
      loadRepositoryData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete file', 'error');
    }
  };

  // Batch Delete handler
  const handleBatchDelete = async (selectedFiles: TeachingFile[]) => {
    const isTrash = activeTab === 'trash';
    const msg = isTrash
      ? `Permanently delete ${selectedFiles.length} selected resource(s)? This cannot be undone.`
      : `Move ${selectedFiles.length} selected resource(s) to trash?`;

    if (!window.confirm(msg)) return;

    try {
      const ids = selectedFiles.map((f) => f.id);
      await api.batchDeleteFiles(ids, isTrash);
      showToast(
        `${selectedFiles.length} file(s) ${isTrash ? 'permanently deleted' : 'moved to trash'}`,
        'success'
      );
      if (previewFile && ids.includes(previewFile.id)) setPreviewFile(null);
      syncManager.emit('file-updated', { fileIds: ids, type: 'batch-delete' });
      loadRepositoryData();
    } catch (err: any) {
      showToast(err.message || 'Batch delete failed', 'error');
    }
  };

  // Batch Move handler
  const handleBatchMove = async (selectedFiles: TeachingFile[], targetFolderId: string | null) => {
    try {
      const ids = selectedFiles.map((f) => f.id);
      await api.batchMoveFiles(ids, targetFolderId);
      showToast(`Successfully moved ${selectedFiles.length} file(s)`, 'success');
      syncManager.emit('file-updated', { fileIds: ids, type: 'batch-move' });
      loadRepositoryData();
    } catch (err: any) {
      showToast(err.message || 'Batch move failed', 'error');
    }
  };

  // Batch Download handler
  const handleBatchDownload = async (selectedFiles: TeachingFile[]) => {
    showToast(`Initiating download for ${selectedFiles.length} file(s)...`, 'info');
    for (let i = 0; i < selectedFiles.length; i++) {
      await downloadTeachingFile(selectedFiles[i]);
      if (i < selectedFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
    showToast(`Downloaded ${selectedFiles.length} file(s) successfully`, 'success');
  };

  // Folders handlers
  const handleCreateFolder = async (name: string, parentId: string | null, color: string) => {
    await api.createFolder(name, parentId, color);
    showToast(`Folder "${name}" created`, 'success');
    loadRepositoryData();
  };

  const handleUpdateFolder = async (id: string, name: string, parentId: string | null, color: string) => {
    await api.updateFolder(id, { folder_name: name, parent_folder_id: parentId, color });
    showToast(`Folder updated`, 'success');
    loadRepositoryData();
  };

  // Sharing handler
  const handleSaveShare = async (
    fileId: string,
    sharedUserId?: string,
    permission: 'view' | 'edit' = 'view',
    sharedMode?: string
  ) => {
    await api.shareFile(fileId, sharedUserId, permission, sharedMode);
    showToast('Resource access permissions updated', 'success');
    loadRepositoryData();
  };

  // Loading Screen
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 animate-pulse">
          <HardDrive className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-semibold text-white">Teacher Resource Hub</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to centralized educational repository...</p>
      </div>
    );
  }

  // Unauthenticated: Show Login Page
  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} onDeviceChange={handleDeviceChange} />;
  }

  // Determine Tab Title & View Mode
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Teacher Resource Hub';
      case 'my-resources':
        return 'My Educational Resources';
      case 'folders':
        return 'All Folders & Curricula';
      case 'documents':
        return 'Document Worksheets & Textbooks';
      case 'videos':
        return 'Lesson Videos Library';
      case 'audio':
        return 'Audio Lectures & Pronunciation';
      case 'images':
        return 'Educational Images & Diagrams';
      case 'shared':
        return 'Shared Across Teachers';
      case 'recent':
        return 'Recently Uploaded Resources';
      case 'recent-activity':
        return 'Recent Activity & Audit Log';
      case 'favorites':
        return 'Starred Resource Favorites';
      case 'trash':
        return 'Recycle Bin & Trash';
      case 'settings':
        return 'Account & Storage Settings';
      case 'about':
        return 'App Developer Info & About';
      default:
        return 'Resources';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Offline Status Notification Banner */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-600/50 text-amber-200 px-4 py-2 text-xs flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            <strong>Offline Mode Active:</strong> You are disconnected from the network. Viewing local files cached in IndexedDB.
          </span>
        </div>
      )}

      {/* PWA Install Prompt Banner */}
      {isInstallable && (
        <div className="bg-indigo-950/80 border-b border-indigo-700/50 text-indigo-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-indigo-400" />
            <span>Install Teacher Resource Hub as a desktop or mobile application for instant offline access.</span>
          </div>
          <button
            type="button"
            onClick={installPWA}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Install App
          </button>
        </div>
      )}

      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-700 text-indigo-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-indigo-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Global Top Navbar */}
      <Navbar
        user={currentUser}
        storageUsed={effectiveStorageUsed}
        storageLimit={effectiveStorageLimit}
        currentDevice={currentDevice}
        onDeviceChange={handleDeviceChange}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onNavigate={(tab) => {
          if (tab === 'admin-rules') {
            setRulesModalOpen(true);
            return;
          }
          setActiveTab(tab);
          setCurrentFolderId(null);
        }}
        onOpenRules={() => setRulesModalOpen(true)}
        onOpenCrossDeviceModal={() => setCrossDeviceModalOpen(true)}
      />

      {/* Storage Critical Warning Banner (Usage exceeds 90% quota) */}
      {isStorageCritical && (
        <div className="bg-rose-950/90 border-b border-rose-700/80 text-rose-200 px-4 py-2.5 flex items-center justify-between text-xs z-30 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <span className="font-bold text-white shrink-0">Storage Warning ({storagePercentage}% Used):</span>
            <span className="truncate hidden sm:inline">
              You are using {formatBytes(effectiveStorageUsed)} of {formatBytes(effectiveStorageLimit)}. Please delete old files or empty Trash to prevent upload disruptions.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={() => {
                setActiveTab('trash');
                setCurrentFolderId(null);
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Empty Trash
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('admin-storage');
                  setCurrentFolderId(null);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer hidden sm:inline-block"
              >
                Manage Quotas
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Body with Sidebar docked to the left and Content Container */}
      <div className="flex-1 flex w-full pb-16 md:pb-6">
        {/* Responsive Desktop & Mobile Drawer Sidebar */}
        <Sidebar
          currentTab={activeTab as any}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setCurrentFolderId(null);
            setMobileSidebarOpen(false);
          }}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setCurrentFolderId(null);
            setMobileSidebarOpen(false);
          }}
          user={currentUser}
          userRole={currentUser?.role}
          onOpenUploadModal={() => setUploadModalOpen(true)}
          onOpenUpload={() => setUploadModalOpen(true)}
          storageUsed={effectiveStorageUsed}
          storageLimit={effectiveStorageLimit}
          isOpen={mobileSidebarOpen}
          isOpenMobile={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Content View Panel */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          {/* Active Tab Routing */}
          {activeTab === 'dashboard' && (
            <DashboardOverview
              user={currentUser}
              stats={stats}
              recentFiles={files}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setCurrentFolderId(null);
              }}
              onOpenUpload={() => setUploadModalOpen(true)}
              onNewFolder={() => {
                setEditingFolder(null);
                setFolderModalOpen(true);
              }}
              onPreviewFile={handlePreviewFile}
              onDownloadFile={handleDownloadFile}
            />
          )}

          {/* Recent Activity & Audit Log Tab */}
          {activeTab === 'recent-activity' && (
            <RecentActivityView
              onOpenFileByName={(name) => {
                const target = files.find((f) => f.file_name.toLowerCase() === name.toLowerCase());
                if (target) handlePreviewFile(target);
              }}
            />
          )}

          {/* File Manager Views */}
          {(activeTab === 'my-resources' ||
            activeTab === 'folders' ||
            activeTab === 'documents' ||
            activeTab === 'videos' ||
            activeTab === 'audio' ||
            activeTab === 'images' ||
            activeTab === 'shared' ||
            activeTab === 'recent' ||
            activeTab === 'favorites' ||
            activeTab === 'trash') && (
            <FileManager
              title={getTabTitle()}
              categoryFilter={
                activeTab === 'documents'
                  ? 'document'
                  : activeTab === 'videos'
                  ? 'video'
                  : activeTab === 'audio'
                  ? 'audio'
                  : activeTab === 'images'
                  ? 'image'
                  : undefined
              }
              files={
                activeTab === 'shared'
                  ? files.filter((f) => f.shared_mode && f.shared_mode !== 'private')
                  : activeTab === 'favorites'
                  ? files.filter((f) => f.is_favorite)
                  : files
              }
              folders={folders}
              currentFolderId={currentFolderId}
              onSelectFolder={setCurrentFolderId}
              currentUser={currentUser}
              onPreview={handlePreviewFile}
              onDownload={handleDownloadFile}
              onRename={handleStartRename}
              onMove={handleStartMove}
              onCopy={handleCopyFile}
              onDelete={handleDeleteFile}
              onToggleFavorite={handleToggleFavorite}
              onShowInfo={(f) => setInfoModalFile(f)}
              onShare={(f) => setShareModalFile(f)}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenNewFolder={() => {
                setEditingFolder(null);
                setFolderModalOpen(true);
              }}
              onBatchDelete={handleBatchDelete}
              onBatchMove={handleBatchMove}
              onBatchDownload={handleBatchDownload}
            />
          )}

          {/* Admin Panels */}
          {activeTab.startsWith('admin-') && (
            currentUser.role === 'admin' ? (
              <AdminDashboard
                currentUser={currentUser}
                initialTab={activeTab.replace('admin-', '') as any}
                onTabChange={(tab) => setActiveTab(('admin-' + tab) as any)}
                onRefreshUser={loadRepositoryData}
              />
            ) : (
              <div className="bg-slate-800/90 border border-amber-500/40 rounded-2xl p-8 max-w-xl mx-auto my-12 text-center space-y-4 shadow-xl animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Institutional Administrative Policy</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are signed in as <span className="font-semibold text-white">{currentUser.username}</span> in a <span className="text-indigo-400 font-medium">Multi-User Teacher</span> profile. Per institutional security governance, administrative rights are strictly disabled for multi-user accounts.
                </p>
                <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-xl text-[11px] text-slate-400 max-w-md mx-auto text-left space-y-1">
                  <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> Institutional Rule Hierarchy
                  </div>
                  <div>&bull; <strong className="text-slate-200">Sole Sovereign Master Administrator:</strong> pssofttech@gmail.com</div>
                  <div>&bull; <strong className="text-slate-200">Multi-User Teacher Accounts:</strong> Isolated workspaces with administrative rights permanently disabled.</div>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setRulesModalOpen(true)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Scale className="w-4 h-4" /> View Institutional Governance Rules
                  </button>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-white">Teacher Profile & Device Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block mb-1">Username</span>
                    <span className="font-semibold text-white">{currentUser.username}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block mb-1">Email Address</span>
                    <span className="font-semibold text-white">{currentUser.email}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block mb-1">Role & Permissions</span>
                    <span className="font-semibold uppercase text-indigo-400">{currentUser.role}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block mb-1">Department</span>
                    <span className="font-semibold text-white">{currentUser.department || 'General Faculty'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-white">Storage Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Used: {formatBytes(currentUser.storage_used)}</span>
                    <span>Total Quota: {formatBytes(currentUser.storage_limit)}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (currentUser.storage_used / (currentUser.storage_limit || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About & App Developer Info Tab */}
          {activeTab === 'about' && (
            <AboutView onCopyNotice={(msg) => showToast(msg, 'success')} />
          )}
        </main>
      </div>

      {/* Persistent Cross-Device Cloud Sync Status in Footer */}
      <FooterSyncStatus
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        isOnline={isOnline}
        totalFiles={files.length}
        onManualSync={() => {
          loadRepositoryData();
          showToast('Refreshing real-time data from Firestore...', 'info');
        }}
        onOpenCrossDeviceModal={() => setCrossDeviceModalOpen(true)}
      />

      {/* Mobile Touch Bottom Nav */}
      <MobileBottomNav
        currentTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setCurrentFolderId(null);
        }}
        onOpenUpload={() => setUploadModalOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* All Modal Overlays */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folders={folders}
        initialFolderId={currentFolderId}
        onUploadSuccess={(newFiles) => {
          showToast(`Successfully uploaded ${newFiles.length} file(s)!`, 'success');
          syncManager.emit('file-updated', { count: newFiles.length, type: 'upload' });
          loadRepositoryData();
        }}
      />

      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
        folders={folders}
        parentFolderId={currentFolderId}
        editingFolder={editingFolder}
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
      />

      {/* Universal Preview Modal (handles all file types: Video, Audio, Document, Image, PPTX, Sheet, Text/Code) */}
      <UniversalPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
        onRename={handleStartRename}
        onDelete={(f) => handleDeleteFile(f, activeTab === 'trash')}
      />

      <FileInfoModal
        file={infoModalFile}
        onClose={() => setInfoModalFile(null)}
        onDownload={handleDownloadFile}
      />

      <ShareModal
        file={shareModalFile}
        onClose={() => setShareModalFile(null)}
        onSaveShare={handleSaveShare}
      />

      {/* Rename File Prompt Dialog */}
      {renameModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Rename File</h3>
            <form onSubmit={handleConfirmRename} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModalFile(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move File to Folder Dialog */}
      {moveModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Move "{moveModalFile.file_name}"</h3>
            <form onSubmit={handleConfirmMove} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Folder</label>
              <select
                value={moveTargetFolderId}
                onChange={(e) => setMoveTargetFolderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="root">📁 Root Directory (Unfiled)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📂 {f.folder_name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMoveModalFile(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Move Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Institutional Governance Rules Modal */}
      <InstitutionalRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />

      {/* Cross-Device Phone & Desktop Link Instructions Modal */}
      <CrossDeviceModal
        isOpen={crossDeviceModalOpen}
        onClose={() => setCrossDeviceModalOpen(false)}
        userEmail={currentUser?.email || 'vadivubiochem@gmail.com'}
      />
    </div>
  );
}
