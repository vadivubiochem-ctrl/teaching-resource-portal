import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  Folder,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Laptop,
  Play,
  RotateCw,
  Pause,
  Camera,
  FolderTree,
} from 'lucide-react';
import type { Folder as FolderType, TeachingFile, UploadProgressItem } from '../types.js';
import { api, getSimulatedDevice } from '../services/api.js';
import { formatBytes } from '../utils/formatters.js';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  initialFolderId: string | null;
  onUploadSuccess: (newFiles: TeachingFile[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folders,
  initialFolderId,
  onUploadSuccess,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string>(initialFolderId || 'auto');
  const [activeDevice, setActiveDevice] = useState(getSimulatedDevice());
  const [isDragging, setIsDragging] = useState(false);

  // Upload Progress State
  const [uploadItems, setUploadItems] = useState<UploadProgressItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [cancelFns, setCancelFns] = useState<(() => void)[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const array = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...array]);
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const uploadedResults: TeachingFile[] = [];
    const cancels: (() => void)[] = [];

    // Initialize progress items
    const initialItems: UploadProgressItem[] = selectedFiles.map((f, i) => ({
      id: `file_${i}_${Date.now()}`,
      fileName: f.name,
      fileSize: f.size,
      uploadedBytes: 0,
      percentage: 0,
      speed: '0 KB/s',
      remainingTime: 'Starting...',
      status: 'uploading',
    }));
    setUploadItems(initialItems);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const folderParam = targetFolderId === 'root' || targetFolderId === 'auto' ? null : targetFolderId;

      await new Promise<void>((resolve) => {
        const cancel = api.uploadWithProgress(
          file,
          folderParam,
          activeDevice,
          (progress) => {
            setUploadItems((prev) =>
              prev.map((item, idx) => (idx === i ? { ...item, ...progress } : item))
            );
          },
          (uploadedFile) => {
            if (uploadedFile) uploadedResults.push(uploadedFile);
            resolve();
          },
          (err) => {
            setUploadItems((prev) =>
              prev.map((item, idx) =>
                idx === i ? { ...item, status: 'failed', errorMessage: err.message } : item
              )
            );
            resolve();
          }
        );
        cancels.push(cancel);
      });
    }

    setCancelFns(cancels);
    setIsUploading(false);

    if (uploadedResults.length > 0) {
      onUploadSuccess(uploadedResults);
      setTimeout(() => {
        onClose();
        setSelectedFiles([]);
        setUploadItems([]);
      }, 1200);
    }
  };

  const cancelUpload = () => {
    cancelFns.forEach((fn) => fn());
    setIsUploading(false);
    setUploadItems((prev) =>
      prev.map((item) => (item.status === 'uploading' ? { ...item, status: 'paused', errorMessage: 'Cancelled' } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload Teaching Resources</h3>
              <p className="text-[11px] text-slate-400">Save to central cloud &bull; Access from any device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Target Folder & Device Selector Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-400" /> Target Folder
              </label>
              <select
                value={targetFolderId}
                onChange={(e) => setTargetFolderId(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="auto">✨ Auto-Organize (Documents, Images, Videos, Audio)</option>
                <option value="root">📁 Root Directory (Unfiled)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📂 {f.folder_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                {activeDevice.toLowerCase().includes('mobile') ? (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Laptop className="w-3.5 h-3.5 text-blue-400" />
                )}
                Active Device Tag
              </label>
              <select
                value={activeDevice}
                onChange={(e) => setActiveDevice(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Desktop (Windows 11 PC)">💻 Desktop Computer (Windows/PC)</option>
                <option value="Desktop (MacBook Pro)">💻 Desktop Computer (Mac)</option>
                <option value="Mobile (Android Phone)">📱 Mobile Phone (Android)</option>
                <option value="Mobile (iPhone 15 Pro)">📱 Mobile Phone (iPhone)</option>
                <option value="Tablet (iPad Pro)">📟 Tablet (iPad)</option>
              </select>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Select files from any location on computer or phone
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
              Desktop, Documents, Downloads, USB flash drive, or phone gallery.
              <br />
              Supports PDF, DOCX, PPTX, XLSX, MP4, WebM, MP3, WAV, JPG, PNG & more.
            </p>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="video/*,image/*"
              capture="environment"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                id="select-computer-files-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Laptop className="w-4 h-4" /> Browse Computer / Files
              </button>

              <button
                type="button"
                id="select-mobile-camera-btn"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-emerald-400" /> Phone Camera / Gallery
              </button>
            </div>
          </div>

          {/* Staged files list */}
          {selectedFiles.length > 0 && !isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                <span>Selected Files ({selectedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-400 hover:text-rose-300 text-[11px]"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({formatBytes(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 9 Upload Progress UI */}
          {uploadItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Cloud Upload Progress</span>
                {isUploading && (
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                  >
                    Cancel Upload
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {uploadItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-800 border border-slate-700 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate max-w-xs">{item.fileName}</span>
                      <span className="font-bold text-indigo-400">{item.percentage}%</span>
                    </div>

                    {/* Visual Progress Bar matching User Prompt */}
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.status === 'failed'
                            ? 'bg-rose-500'
                            : item.status === 'completed'
                            ? 'bg-emerald-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>
                        {formatBytes(item.uploadedBytes || (item.fileSize * item.percentage) / 100)} /{' '}
                        {formatBytes(item.fileSize)}
                      </span>
                      <span>
                        {item.status === 'completed'
                          ? '100% Complete'
                          : item.status === 'failed'
                          ? item.errorMessage || 'Failed'
                          : `${item.speed} &bull; ${item.remainingTime}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            id="start-upload-btn"
            onClick={startUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Start Upload ({selectedFiles.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
