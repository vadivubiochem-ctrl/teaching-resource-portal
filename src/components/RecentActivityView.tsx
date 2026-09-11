import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Upload,
  FolderInput,
  Trash2,
  Edit3,
  Search,
  Download,
  RefreshCw,
  Clock,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Shield,
  Layers,
  Eye,
  HardDrive,
  Lock,
} from 'lucide-react';
import type { AuditLog } from '../types.js';
import { api } from '../services/api.js';
import { formatDate } from '../utils/formatters.js';

interface RecentActivityViewProps {
  onOpenFileByName?: (fileName: string) => void;
}

export const RecentActivityView: React.FC<RecentActivityViewProps> = ({ onOpenFileByName }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'upload' | 'move' | 'delete' | 'rename' | 'download'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      // Sort newest first
      const sorted = [...res.auditLogs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setLogs(sorted);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by type
      if (filterType === 'upload' && !log.action.includes('UPLOAD')) return false;
      if (filterType === 'move' && !log.action.includes('MOVE')) return false;
      if (
        filterType === 'delete' &&
        !log.action.includes('DELETE') &&
        !log.action.includes('TRASH')
      )
        return false;
      if (filterType === 'rename' && !log.action.includes('RENAME')) return false;
      if (
        filterType === 'download' &&
        !log.action.includes('DOWNLOAD') &&
        !log.action.includes('CACHE')
      )
        return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTarget = log.target_name.toLowerCase().includes(q);
        const matchUser = log.username.toLowerCase().includes(q);
        const matchAction = log.action.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q) || false;
        if (!matchTarget && !matchUser && !matchAction && !matchDetails) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filterType, searchQuery]);

  // Metric counts
  const uploadCount = logs.filter((l) => l.action.includes('UPLOAD')).length;
  const moveCount = logs.filter((l) => l.action.includes('MOVE')).length;
  const deleteCount = logs.filter((l) => l.action.includes('DELETE') || l.action.includes('TRASH')).length;
  const renameCount = logs.filter((l) => l.action.includes('RENAME')).length;
  const downloadCount = logs.filter((l) => l.action.includes('DOWNLOAD') || l.action.includes('CACHE')).length;

  const exportCSV = () => {
    const headers = 'ID,Timestamp,Action,Target,User,Device,Details\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.action}","${l.target_name.replace(/"/g, '""')}","${
            l.username
          }","${l.device}","${(l.details || '').replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher_hub_recent_activity_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('UPLOAD')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <Upload className="w-3 h-3" /> Upload
        </span>
      );
    }
    if (action.includes('MOVE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
          <FolderInput className="w-3 h-3" /> Move
        </span>
      );
    }
    if (action.includes('DELETE') || action.includes('TRASH')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
          <Trash2 className="w-3 h-3" /> Deletion
        </span>
      );
    }
    if (action.includes('RENAME')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
          <Edit3 className="w-3 h-3" /> Rename
        </span>
      );
    }
    if (action.includes('DOWNLOAD')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
          <Download className="w-3 h-3" /> Download
        </span>
      );
    }
    if (action.includes('CACHE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/20">
          <HardDrive className="w-3 h-3" /> Offline Sync
        </span>
      );
    }
    if (action.includes('PERMISSION') || action.includes('SHARE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
          <Lock className="w-3 h-3" /> Permission
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
        <Clock className="w-3 h-3" /> {action}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Recent Activity</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Audit Log
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Chronological history of file uploads, moves, renames, and deletions for auditing and compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Uploads</span>
            <Upload className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white mt-1">{uploadCount}</p>
          <span className="text-[10px] text-emerald-400">Chronologically logged</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Files Moved</span>
            <FolderInput className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white mt-1">{moveCount}</p>
          <span className="text-[10px] text-amber-400">Folder reorganizations</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Deletions & Trashed</span>
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-white mt-1">{deleteCount}</p>
          <span className="text-[10px] text-rose-400">Audited removals</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Renames</span>
            <Edit3 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-white mt-1">{renameCount}</p>
          <span className="text-[10px] text-purple-400">Title modifications</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'upload' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Uploads ({uploadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('move')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'move' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Moves ({moveCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('delete')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'delete' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Deletions ({deleteCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('rename')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'rename' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Renames ({renameCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('download')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === 'download' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Downloads & Sync ({downloadCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activity records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No activity records match your filter</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              File uploads, folder reorganizations, and deletions will appear chronologically in this audit log.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{getActionBadge(log.action)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenFileByName && onOpenFileByName(log.target_name)}
                        className="font-semibold text-white text-xs sm:text-sm hover:text-indigo-400 hover:underline text-left transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Click to preview resource"
                      >
                        <span className="truncate">{log.target_name}</span>
                        {onOpenFileByName && <Eye className="w-3 h-3 text-indigo-400 shrink-0 opacity-70 hover:opacity-100" />}
                      </button>
                      {log.details && (
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {log.details}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-300 font-medium">{log.username}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {log.device.toLowerCase().includes('mobile') ? (
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Laptop className="w-3 h-3 text-blue-400" />
                        )}
                        <span>{log.device}</span>
                      </span>
                      <span>•</span>
                      <span>IP: {log.ip}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 sm:self-center pl-2">
                  <span className="text-xs text-slate-400 font-medium block">{formatDate(log.timestamp)}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
