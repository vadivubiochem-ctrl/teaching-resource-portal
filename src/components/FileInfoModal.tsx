import React from 'react';
import {
  Info,
  X,
  HardDrive,
  Calendar,
  User as UserIcon,
  Smartphone,
  Laptop,
  Share2,
  FileCode,
  Folder,
  Shield,
  Download,
} from 'lucide-react';
import type { TeachingFile } from '../types.js';
import { formatBytes, formatDateTime } from '../utils/formatters.js';

interface FileInfoModalProps {
  file: TeachingFile | null;
  onClose: () => void;
  onDownload: (file: TeachingFile) => void;
}

export const FileInfoModal: React.FC<FileInfoModalProps> = ({ file, onClose, onDownload }) => {
  if (!file) return null;

  // Simulated secure hash for integrity check
  const simulatedSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    .split('')
    .map((c, i) => (i % 3 === 0 ? file.id[i % file.id.length] || c : c))
    .join('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">File Information</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Rows */}
        <div className="p-5 space-y-3.5 text-xs text-slate-300">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              File Name
            </span>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono break-all">
              {file.file_name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Category
              </span>
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 capitalize font-medium text-slate-200">
                {file.file_type} ({file.file_extension})
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Size
              </span>
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 font-medium text-slate-200">
                {formatBytes(file.file_size)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Uploaded Device
              </span>
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 font-medium text-slate-200 flex items-center gap-1.5">
                {file.device.toLowerCase().includes('mobile') ? (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Laptop className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span className="truncate">{file.device}</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Owner
              </span>
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 font-medium text-slate-200 truncate">
                {file.owner_name}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Upload Date & Timestamp
            </span>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              {formatDateTime(file.uploaded_at)}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Sharing Permission Mode
            </span>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span className="capitalize font-medium">
                {file.shared_mode === 'all_teachers'
                  ? 'Shared with all teachers in hub'
                  : file.shared_mode === 'shared_users'
                  ? 'Shared with selected teachers'
                  : file.shared_mode === 'admin_only'
                  ? 'Admin Only'
                  : 'Private (Only Owner)'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> Cloud Integrity Hash (SHA-256)
            </span>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 break-all select-all">
              {simulatedSha256}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onDownload(file)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download File
          </button>
        </div>
      </div>
    </div>
  );
};
