import React from 'react';
import {
  Folder,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  HardDrive,
  FileSpreadsheet,
  Upload,
  FolderPlus,
  ArrowRight,
  Smartphone,
  Laptop,
  Cloud,
  Play,
  Eye,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { User, TeachingFile, SystemStats } from '../types.js';
import { formatBytes, formatDate } from '../utils/formatters.js';

interface DashboardOverviewProps {
  user: User;
  stats: SystemStats | null;
  recentFiles: TeachingFile[];
  onNavigate: (tab: any) => void;
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
  onPreviewFile: (file: TeachingFile) => void;
  onDownloadFile: (file: TeachingFile) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  stats,
  recentFiles,
  onNavigate,
  onOpenUpload,
  onOpenNewFolder,
  onPreviewFile,
  onDownloadFile,
}) => {
  const statCards = [
    {
      title: 'Total Folders',
      value: stats?.totalFolders ?? 0,
      icon: Folder,
      color: 'from-blue-600 to-indigo-600',
      tab: 'folders',
    },
    {
      title: 'Documents',
      value: stats?.totalDocuments ?? 0,
      icon: FileText,
      color: 'from-emerald-600 to-teal-600',
      tab: 'documents',
    },
    {
      title: 'Videos',
      value: stats?.totalVideos ?? 0,
      icon: Video,
      color: 'from-rose-600 to-pink-600',
      tab: 'videos',
    },
    {
      title: 'Audio',
      value: stats?.totalAudio ?? 0,
      icon: Music,
      color: 'from-amber-600 to-orange-600',
      tab: 'audio',
    },
    {
      title: 'Images',
      value: stats?.totalImages ?? 0,
      icon: ImageIcon,
      color: 'from-purple-600 to-indigo-600',
      tab: 'images',
    },
    {
      title: 'Other Files',
      value: stats?.totalOther ?? 0,
      icon: FileSpreadsheet,
      color: 'from-cyan-600 to-blue-600',
      tab: 'my-resources',
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats?.totalStorageUsed ?? user.storage_used),
      icon: HardDrive,
      color: 'from-indigo-600 to-violet-600',
      tab: 'settings',
      isCustomVal: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Educational Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-800 to-slate-900 border border-indigo-800/50 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Centralized Cloud Repository
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user.username}!
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Manage all your teaching resources from one secure place.
            <br />
            Upload from your computer or mobile and access your resources anywhere.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              id="dashboard-quick-upload-btn"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload New File
            </button>
            <button
              type="button"
              id="dashboard-quick-folder-btn"
              onClick={onOpenNewFolder}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" /> Create Folder
            </button>
            <button
              type="button"
              id="dashboard-quick-videos-btn"
              onClick={() => onNavigate('videos')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4 text-rose-400" /> Watch Lesson Videos
            </button>
          </div>
        </div>
      </div>

      {/* Cross-Device Sync Demonstration Banner */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Cross-Device Workflow Active
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload on Mobile Phone ➔ Centrally Stored in Cloud ➔ Available on Desktop Computer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Mobile
            </span>
            <span className="text-slate-500">➔</span>
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" /> Cloud
            </span>
            <span className="text-slate-500">➔</span>
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Laptop className="w-3.5 h-3.5 text-blue-400" /> Desktop
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Repository Statistics</h3>
          <span className="text-xs text-slate-400">Live Sync</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                id={`stat-card-${idx}`}
                type="button"
                onClick={() => onNavigate(card.tab)}
                className="text-left bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-xl p-3.5 transition-all group cursor-pointer shadow-sm hover:border-slate-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-lg font-bold text-white tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                  {card.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Resources Section */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Recent Teaching Resources</h3>
            <p className="text-xs text-slate-400 mt-0.5">Files uploaded across your mobile and computer devices</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('my-resources')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All Files <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentFiles.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No files uploaded yet. Click Upload to add your first lesson or worksheet!
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {recentFiles.slice(0, 6).map((file) => (
              <div
                key={file.id}
                onClick={() => onPreviewFile(file)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-750/50 px-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {file.file_type === 'video' && <Video className="w-5 h-5 text-rose-400" />}
                    {file.file_type === 'audio' && <Music className="w-5 h-5 text-amber-400" />}
                    {file.file_type === 'document' && <FileText className="w-5 h-5 text-emerald-400" />}
                    {file.file_type === 'image' && <ImageIcon className="w-5 h-5 text-purple-400" />}
                    {file.file_type === 'other' && <Folder className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-2">
                      <span className="truncate">{file.file_name}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                        {file.file_extension}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatBytes(file.file_size)}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        {file.device.toLowerCase().includes('mobile') ? (
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Laptop className="w-3 h-3 text-blue-400" />
                        )}
                        {file.device}
                      </span>
                      <span>&bull;</span>
                      <span>{formatDate(file.uploaded_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {file.file_type === 'video' || file.file_type === 'audio' ? (
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                      title="Play Media"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDownloadFile(file)}
                    className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
