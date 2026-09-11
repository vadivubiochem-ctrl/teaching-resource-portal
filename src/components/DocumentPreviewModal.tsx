import React, { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Download,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  HardDrive,
  User as UserIcon,
  Smartphone,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import type { TeachingFile } from '../types.js';
import { formatBytes, formatDate } from '../utils/formatters.js';

interface DocumentPreviewModalProps {
  file: TeachingFile | null;
  onClose: () => void;
  onDownload: (file: TeachingFile) => void;
  onRename: (file: TeachingFile) => void;
  onDelete: (file: TeachingFile) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  file,
  onClose,
  onDownload,
  onRename,
  onDelete,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!file) return;

    // If text or small doc, fetch content preview
    const isText = ['txt', 'md', 'csv', 'json', 'js', 'ts', 'html'].includes(file.file_extension.toLowerCase());
    if (isText) {
      setLoadingText(true);
      fetch(`/api/files/${file.id}/download`)
        .then((res) => res.text())
        .then((txt) => {
          setTextContent(txt);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent(null);
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;

  const isPdf = file.file_extension.toLowerCase() === 'pdf';
  const isImage = file.file_type === 'image';
  const streamUrl = `/api/files/${file.id}/download`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{file.file_name}</h3>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                {file.file_extension.toUpperCase()} Document
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDownload(file)}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-xs flex items-center gap-1.5 font-semibold"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => onRename(file)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Rename File"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rename</span>
            </button>
            <button
              onClick={() => onDelete(file)}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors text-xs flex items-center gap-1"
              title="Delete Document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50 flex flex-col items-center justify-center min-h-[300px]">
          {isImage ? (
            <div className="flex items-center justify-center max-h-[55vh]">
              <img
                src={streamUrl}
                alt={file.file_name}
                className="max-h-[55vh] max-w-full rounded-xl object-contain shadow-md"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-[55vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col">
              <iframe
                src={`${streamUrl}#view=FitH`}
                title={file.file_name}
                className="w-full h-full border-none rounded-xl"
              />
            </div>
          ) : textContent !== null ? (
            <div className="w-full h-[55vh] bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-y-auto border border-slate-800 whitespace-pre-wrap">
              {loadingText ? 'Loading document text...' : textContent}
            </div>
          ) : (
            <div className="text-center p-8 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">{file.file_name}</h4>
              <p className="text-xs text-slate-400 mb-4">
                Structured {file.file_extension.toUpperCase()} Educational Document ({formatBytes(file.file_size)}).
                Click below to download or view in your native application.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onDownload(file)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download to Computer / Phone
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">File Size</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> {formatBytes(file.file_size)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Uploaded On</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {formatDate(file.uploaded_at)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Device Source</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              {file.device.toLowerCase().includes('mobile') ? (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
              )}
              {file.device}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Teacher</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" /> {file.owner_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
