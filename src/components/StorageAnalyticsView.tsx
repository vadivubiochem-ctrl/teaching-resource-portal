import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  HardDrive,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  Eye,
  Download,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { TeachingFile, User, SystemStats } from '../types.js';
import { formatBytes, formatDate } from '../utils/formatters.js';
import { DynamicFileIcon } from '../services/fileIconService.js';

interface StorageAnalyticsViewProps {
  files: TeachingFile[];
  user: User;
  stats?: SystemStats | null;
  onPreviewFile: (file: TeachingFile) => void;
  onDownloadFile: (file: TeachingFile) => void;
  onDeleteFile: (file: TeachingFile, permanent?: boolean) => void;
  onNavigateToCategory?: (category: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Videos: '#E11D48',
  Documents: '#10B981',
  Audio: '#8B5CF6',
  Images: '#06B6D4',
  Spreadsheets: '#059669',
  Presentations: '#EA580C',
  Archives: '#F59E0B',
  Other: '#64748B',
};

export const StorageAnalyticsView: React.FC<StorageAnalyticsViewProps> = ({
  files,
  user,
  stats,
  onPreviewFile,
  onDownloadFile,
  onDeleteFile,
  onNavigateToCategory,
}) => {
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Active (non-trashed) vs trashed files
  const activeFiles = useMemo(() => files.filter((f) => !f.is_trashed), [files]);
  const trashedFiles = useMemo(() => files.filter((f) => f.is_trashed), [files]);

  const trashedBytes = useMemo(
    () => trashedFiles.reduce((sum, f) => sum + (f.file_size || 0), 0),
    [trashedFiles]
  );

  const totalUsedBytes = useMemo(
    () => stats?.totalStorageUsed ?? user.storage_used ?? activeFiles.reduce((s, f) => s + f.file_size, 0),
    [stats, user, activeFiles]
  );

  const storageLimit = stats?.storageLimit ?? user.storage_limit ?? 16106127360; // 15 GB default
  const usedPercentage = Math.min(100, Math.round((totalUsedBytes / (storageLimit || 1)) * 100));
  const remainingBytes = Math.max(0, storageLimit - totalUsedBytes);

  // Aggregate by Category
  const categoryStats = useMemo(() => {
    const map: Record<string, { bytes: number; count: number; categoryKey: string }> = {
      Videos: { bytes: 0, count: 0, categoryKey: 'video' },
      Documents: { bytes: 0, count: 0, categoryKey: 'document' },
      Audio: { bytes: 0, count: 0, categoryKey: 'audio' },
      Images: { bytes: 0, count: 0, categoryKey: 'image' },
      Other: { bytes: 0, count: 0, categoryKey: 'all' },
    };

    activeFiles.forEach((f) => {
      const ext = f.file_extension?.toLowerCase() || '';
      if (
        f.file_type === 'video' ||
        ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
      ) {
        map.Videos.bytes += f.file_size;
        map.Videos.count += 1;
      } else if (
        f.file_type === 'document' ||
        ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)
      ) {
        map.Documents.bytes += f.file_size;
        map.Documents.count += 1;
      } else if (
        f.file_type === 'audio' ||
        ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)
      ) {
        map.Audio.bytes += f.file_size;
        map.Audio.count += 1;
      } else if (
        f.file_type === 'image' ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
      ) {
        map.Images.bytes += f.file_size;
        map.Images.count += 1;
      } else {
        map.Other.bytes += f.file_size;
        map.Other.count += 1;
      }
    });

    return Object.entries(map).map(([name, data]) => {
      const mb = Number((data.bytes / (1024 * 1024)).toFixed(2));
      const percentage = totalUsedBytes > 0 ? ((data.bytes / totalUsedBytes) * 100).toFixed(1) : '0';
      return {
        name,
        bytes: data.bytes,
        mb,
        count: data.count,
        percentage: Number(percentage),
        color: CATEGORY_COLORS[name] || '#6366F1',
        categoryKey: data.categoryKey,
      };
    });
  }, [activeFiles, totalUsedBytes]);

  // Largest 6 Files
  const largestFiles = useMemo(() => {
    return [...activeFiles].sort((a, b) => b.file_size - a.file_size).slice(0, 6);
  }, [activeFiles]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Storage Analytics & Distribution</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual breakdown of storage consumed by video lessons, documents, audio recordings, and graphics.
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700 text-xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              chartType === 'donut'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Donut Distribution
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              chartType === 'bar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volume Comparison
          </button>
        </div>
      </div>

      {/* Primary Quota Gauge & Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Quota Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cloud Quota</span>
            <span className="text-xs font-bold text-indigo-400 font-mono">{usedPercentage}% Used</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white">{formatBytes(totalUsedBytes)}</div>
            <div className="text-xs text-slate-400">
              Allocated Limit: <span className="text-slate-200">{formatBytes(storageLimit)}</span>
            </div>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedPercentage >= 90
                  ? 'bg-rose-500'
                  : usedPercentage >= 75
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Available: {formatBytes(remainingBytes)}</span>
            <span>{activeFiles.length} files stored</span>
          </div>
        </div>

        {/* Largest Space Consumer */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Space Consumer</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          {categoryStats.length > 0 ? (
            (() => {
              const top = [...categoryStats].sort((a, b) => b.bytes - a.bytes)[0];
              return (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span style={{ color: top.color }}>{top.name}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Consumes <strong className="text-white">{formatBytes(top.bytes)}</strong> ({top.percentage}% of total storage) across {top.count} files.
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-xs text-slate-400">No files uploaded yet.</div>
          )}
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
            💡 Videos typically consume 10x-50x more space than documents.
          </div>
        </div>

        {/* Trash & Quick Optimization */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reclaimable Space</span>
            <Trash2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-amber-300">{formatBytes(trashedBytes)}</div>
            <div className="text-xs text-slate-400">
              In Trash Folder ({trashedFiles.length} deleted file{trashedFiles.length !== 1 ? 's' : ''})
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Emptying your Trash permanently removes files from Firestore and reclaims cloud storage instantly.
          </p>
        </div>
      </div>

      {/* Main Visualizer: Chart + Category Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Recharts Graph */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              File Type Distribution
            </h3>
            <span className="text-xs text-slate-400">Hover slices to see details</span>
          </div>

          <div className="h-64 sm:h-72 w-full flex items-center justify-center">
            {totalUsedBytes > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'donut' ? (
                  <PieChart>
                    <Pie
                      data={categoryStats.filter((c) => c.bytes > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="mb"
                      nameKey="name"
                    >
                      {categoryStats
                        .filter((c) => c.bytes > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke="#0f172a"
                            strokeWidth={2}
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: data.color }}
                                />
                                {data.name}
                              </div>
                              <div className="text-slate-300">
                                Space: <strong className="text-white">{formatBytes(data.bytes)}</strong> ({data.mb} MB)
                              </div>
                              <div className="text-slate-400">
                                Files: {data.count} | Share: {data.percentage}%
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                ) : (
                  <BarChart
                    data={categoryStats.filter((c) => c.bytes > 0)}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      unit=" MB"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <div className="font-bold text-white">{data.name}</div>
                              <div className="text-slate-300">
                                Consumed: <strong className="text-white">{formatBytes(data.bytes)}</strong>
                              </div>
                              <div className="text-slate-400">
                                Files: {data.count} ({data.percentage}% of total storage)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="mb" radius={[6, 6, 0, 0]}>
                      {categoryStats.filter((c) => c.bytes > 0).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No storage used yet. Upload resources to view real-time distribution.
              </div>
            )}
          </div>
        </div>

        {/* Right: Category Breakdown List */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-white border-b border-slate-700/60 pb-3">
            Category Breakdown
          </h3>

          <div className="space-y-2.5">
            {categoryStats.map((item) => (
              <div
                key={item.name}
                onClick={() => {
                  if (onNavigateToCategory && item.categoryKey) {
                    onNavigateToCategory(item.categoryKey);
                  }
                }}
                className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-600 rounded-xl transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 flex items-center gap-1">
                      <span>{item.name}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.count} file{item.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    {formatBytes(item.bytes)}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 6 Largest Space-Consuming Files */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Largest Files in Repository
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review your heaviest files to easily free up storage or prevent quota overage.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
            Top {largestFiles.length}
          </span>
        </div>

        {largestFiles.length > 0 ? (
          <div className="divide-y divide-slate-700/50">
            {largestFiles.map((file) => (
              <div
                key={file.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-750/30 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <DynamicFileIcon
                    fileName={file.file_name}
                    extension={file.file_extension}
                    fileType={file.file_type}
                    mimeType={file.mime_type}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p
                      onClick={() => onPreviewFile(file)}
                      className="text-xs font-semibold text-white truncate hover:text-indigo-300 cursor-pointer"
                      title={file.file_name}
                    >
                      {file.file_name}
                    </p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>Uploaded {formatDate(file.uploaded_at)}</span>
                      <span>&bull;</span>
                      <span>By {file.owner_name || 'Teacher'}</span>
                      {file.device && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-300">{file.device}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-bold text-rose-300 font-mono bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg">
                    {formatBytes(file.file_size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPreviewFile(file)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors"
                    title="Preview file"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadFile(file)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition-colors"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFile(file)}
                    className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No files available to analyze.
          </div>
        )}
      </div>

      {/* Actionable Storage Tips */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 space-y-2 text-xs text-indigo-200">
        <div className="flex items-center gap-2 font-bold text-indigo-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Storage Optimization Guidelines for Teachers</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
          <li><strong>Videos & Screen Recordings:</strong> Use compressed formats (H.264 MP4) or store video links if lectures exceed 200MB.</li>
          <li><strong>Slide Decks & Handouts:</strong> Export PowerPoint decks as PDF before uploading to cut file size by up to 70%.</li>
          <li><strong>Trash Maintenance:</strong> Items in Trash continue to consume storage until permanently purged. Empty Trash periodically.</li>
        </ul>
      </div>
    </div>
  );
};
