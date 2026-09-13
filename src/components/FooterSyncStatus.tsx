import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  WifiOff,
  Database,
  Check,
} from 'lucide-react';

interface FooterSyncStatusProps {
  lastSyncTime: Date | null;
  isSyncing: boolean;
  isOnline: boolean;
  totalFiles: number;
  onManualSync: () => void;
  onOpenCrossDeviceModal?: () => void;
}

export const FooterSyncStatus: React.FC<FooterSyncStatusProps> = ({
  lastSyncTime,
  isSyncing,
  isOnline,
  totalFiles,
  onManualSync,
  onOpenCrossDeviceModal,
}) => {
  const [, setTick] = useState(0);

  // Re-render periodically to update the relative time (e.g. "Just now", "1m ago")
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const formatRelativeTime = (date: Date | null): string => {
    if (!date) return 'Waiting for first sync...';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formattedAbsoluteTime = lastSyncTime
    ? lastSyncTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  return (
    <footer
      id="footer-sync-status"
      className="sticky bottom-14 md:bottom-0 z-30 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-md px-4 sm:px-6 py-2.5 transition-colors"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 max-w-7xl mx-auto text-xs">
        {/* Left: Cloud Sync Status with Visual Status Icon and 'Last Synced' Timestamp */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          {/* Main Status Badge */}
          <div
            id="footer-sync-badge"
            className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-full shadow-2xs"
          >
            {/* Visual Status Icon */}
            {isSyncing ? (
              <RefreshCw
                id="footer-sync-status-icon"
                className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0"
              />
            ) : isOnline ? (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            ) : (
              <WifiOff
                id="footer-sync-status-icon"
                className="w-3.5 h-3.5 text-amber-400 shrink-0"
              />
            )}

            {isSyncing ? (
              <span className="text-indigo-300 font-semibold flex items-center gap-1.5">
                <span>Syncing cloud data...</span>
              </span>
            ) : isOnline ? (
              <span className="flex items-center gap-1.5 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-bold">Cloud Synced</span>
                <span className="text-slate-500">|</span>
                <span id="footer-last-synced-text" className="text-slate-300">
                  Last Synced: <strong className="text-white font-semibold">{formatRelativeTime(lastSyncTime)}</strong>
                  {formattedAbsoluteTime && (
                    <span className="text-slate-400 font-mono text-[11px] ml-1.5">
                      ({formattedAbsoluteTime})
                    </span>
                  )}
                </span>
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span>Offline (Local Cache Active)</span>
              </span>
            )}
          </div>

          {/* Cross-Device Consistency Verification Badge */}
          <div
            id="cross-device-consistency-badge"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400"
            title="Changes made on mobile or desktop are synchronized to Firestore in real-time"
          >
            <Smartphone className="w-3 h-3 text-emerald-400" />
            <span>Mobile</span>
            <span className="text-indigo-400 font-bold">⇄</span>
            <Laptop className="w-3 h-3 text-blue-400" />
            <span>Desktop</span>
            <span className="text-emerald-400 font-medium ml-1 flex items-center gap-0.5">
              <Check className="w-3 h-3" /> Consistent
            </span>
          </div>
        </div>

        {/* Right: Manual Sync Refresh & Total Resources */}
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-slate-400 hidden md:inline">
            <Database className="w-3 h-3 text-indigo-400 inline mr-1" />
            <strong className="text-slate-200 font-mono">{totalFiles}</strong> resources in cloud
          </span>

          <button
            type="button"
            id="manual-sync-btn"
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-medium transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            title="Check Firestore for new updates from other devices"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

