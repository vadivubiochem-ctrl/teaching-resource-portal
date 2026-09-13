import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  List,
  Folder,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  FolderTree,
  MoreVertical,
  Download,
  Eye,
  Play,
  Share2,
  Trash2,
  Edit2,
  Copy,
  FolderInput,
  Info,
  Smartphone,
  Laptop,
  Search,
  Plus,
  Star,
  CheckCircle2,
  CheckSquare,
  Square,
  Check,
  FolderPlus,
  Upload,
  Keyboard,
  X,
  CloudCheck,
  HelpCircle,
  CornerLeftUp,
  Move,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { TeachingFile, Folder as FolderType, User } from '../types.js';
import { formatBytes, formatDate, formatDuration } from '../utils/formatters.js';
import { getCachedFileIds } from '../services/offlineStorage.js';
import { DynamicFileIcon, getFileFormatMeta } from '../services/fileIconService.js';

interface FileManagerProps {
  files: TeachingFile[];
  folders: FolderType[];
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  currentUser: User;
  onPreview: (file: TeachingFile) => void;
  onDownload: (file: TeachingFile) => void;
  onRename: (file: TeachingFile) => void;
  onMove: (file: TeachingFile) => void;
  onCopy: (file: TeachingFile) => void;
  onDelete: (file: TeachingFile, permanent?: boolean) => void;
  onToggleFavorite: (file: TeachingFile) => void;
  onShowInfo: (file: TeachingFile) => void;
  onShare: (file: TeachingFile) => void;
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
  onBatchDelete?: (files: TeachingFile[]) => void;
  onBatchMove?: (files: TeachingFile[], targetFolderId: string | null) => void;
  onBatchDownload?: (files: TeachingFile[]) => void;
  title?: string;
  categoryFilter?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  folders,
  currentFolderId,
  onSelectFolder,
  currentUser,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onCopy,
  onDelete,
  onToggleFavorite,
  onShowInfo,
  onShare,
  onOpenUpload,
  onOpenNewFolder,
  onBatchDelete,
  onBatchMove,
  onBatchDownload,
  title = 'Resources',
  categoryFilter,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [localSearch, setLocalSearch] = useState('');

  // Multi-select state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const [batchMoveTarget, setBatchMoveTarget] = useState<string>('root');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Drag-and-drop state for moving files between folder tiles
  const [draggingFileIds, setDraggingFileIds] = useState<string[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, file: TeachingFile) => {
    const ids =
      selectedFileIds.has(file.id) && selectedFileIds.size > 1
        ? Array.from(selectedFileIds)
        : [file.id];
    setDraggingFileIds(ids);
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ fileIds: ids }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingFileIds([]);
    setDragOverFolderId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    let fileIdsToMove = draggingFileIds;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.fileIds) && parsed.fileIds.length > 0) {
          fileIdsToMove = parsed.fileIds;
        }
      }
    } catch {
      const textId = e.dataTransfer.getData('text/plain');
      if (textId) fileIdsToMove = [textId];
    }

    if (!fileIdsToMove || fileIdsToMove.length === 0) return;

    const targetFiles = files.filter(
      (f) => fileIdsToMove.includes(f.id) && (f.folder_id || null) !== (targetFolderId || null)
    );

    if (targetFiles.length > 0) {
      if (onBatchMove) {
        onBatchMove(targetFiles, targetFolderId);
      } else {
        targetFiles.forEach((f) => onMove(f));
      }
    }

    setDraggingFileIds([]);
    setSelectedFileIds(new Set());
  };

  // Offline cached file IDs
  const [cachedFileIds, setCachedFileIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCachedFileIds().then((ids) => setCachedFileIds(ids));
  }, [files]);

  // Find current folder and breadcrumbs
  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const breadcrumbs: FolderType[] = [];
  let curr = currentFolder;
  while (curr) {
    breadcrumbs.unshift(curr);
    curr = folders.find((f) => f.id === curr?.parent_folder_id);
  }

  // Filter child folders in this folder
  const childFolders = folders.filter((f) => f.parent_folder_id === currentFolderId);

  // Filter files
  let filteredFiles = files.filter((f) => {
    if (categoryFilter && categoryFilter !== 'all') {
      return f.file_type === categoryFilter;
    }
    if (currentFolderId) {
      return f.folder_id === currentFolderId;
    }
    return true;
  });

  if (localSearch.trim()) {
    const q = localSearch.trim().toLowerCase();
    filteredFiles = filteredFiles.filter(
      (f) =>
        f.file_name.toLowerCase().includes(q) ||
        f.file_extension.toLowerCase().includes(q) ||
        (f.owner_name && f.owner_name.toLowerCase().includes(q))
    );
  }

  // Sort files
  filteredFiles.sort((a, b) => {
    if (sortBy === 'name') {
      const cmp = a.file_name.localeCompare(b.file_name);
      return sortOrder === 'asc' ? cmp : -cmp;
    }
    if (sortBy === 'size') {
      return sortOrder === 'asc' ? a.file_size - b.file_size : b.file_size - a.file_size;
    }
    const timeA = new Date(a.uploaded_at).getTime();
    const timeB = new Date(b.uploaded_at).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const toggleSort = (type: 'date' | 'name' | 'size') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  // Selection handlers
  const toggleSelectFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected =
    filteredFiles.length > 0 && filteredFiles.every((f) => selectedFileIds.has(f.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const clearSelection = () => {
    setSelectedFileIds(new Set());
  };

  const selectedFiles = files.filter((f) => selectedFileIds.has(f.id));

  // Batch actions
  const handleTriggerBatchDelete = () => {
    if (selectedFiles.length === 0) return;
    if (onBatchDelete) {
      onBatchDelete(selectedFiles);
    } else {
      selectedFiles.forEach((f) => onDelete(f));
    }
    clearSelection();
  };

  const handleTriggerBatchDownload = () => {
    if (selectedFiles.length === 0) return;
    if (onBatchDownload) {
      onBatchDownload(selectedFiles);
    } else {
      selectedFiles.forEach((f, i) => {
        setTimeout(() => onDownload(f), i * 300);
      });
    }
  };

  const handleTriggerBatchMove = () => {
    if (selectedFiles.length === 0) return;
    const target = batchMoveTarget === 'root' ? null : batchMoveTarget;
    if (onBatchMove) {
      onBatchMove(selectedFiles, target);
    }
    setBatchMoveOpen(false);
    clearSelection();
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Select All (Ctrl+A or Cmd+A)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
        return;
      }

      // 2. Delete Key (Delete or Backspace with selection)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFileIds.size > 0) {
          e.preventDefault();
          handleTriggerBatchDelete();
        }
        return;
      }

      // 3. Rename Key (F2)
      if (e.key === 'F2') {
        if (selectedFileIds.size === 1) {
          e.preventDefault();
          const targetId = Array.from(selectedFileIds)[0];
          const targetFile = files.find((f) => f.id === targetId);
          if (targetFile) onRename(targetFile);
        }
        return;
      }

      // 4. Preview (Space or Enter)
      if (e.key === ' ' || e.key === 'Enter') {
        if (selectedFileIds.size === 1) {
          e.preventDefault();
          const targetId = Array.from(selectedFileIds)[0];
          const targetFile = files.find((f) => f.id === targetId);
          if (targetFile) onPreview(targetFile);
        }
        return;
      }

      // 5. Escape (Deselect / Close context)
      if (e.key === 'Escape') {
        clearSelection();
        setActiveMenuFileId(null);
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFiles, selectedFileIds, files, onRename, onPreview]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-6 h-6 text-rose-400" />;
      case 'audio':
        return <Music className="w-6 h-6 text-amber-400" />;
      case 'document':
        return <FileText className="w-6 h-6 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-purple-400" />;
      default:
        return <FileText className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            </span>
          </h2>

          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 flex-wrap">
            <button
              onClick={() => onSelectFolder(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverFolderId !== 'breadcrumb-root') setDragOverFolderId('breadcrumb-root');
              }}
              onDragLeave={() => {
                if (dragOverFolderId === 'breadcrumb-root') setDragOverFolderId(null);
              }}
              onDrop={(e) => handleFolderDrop(e, null)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                dragOverFolderId === 'breadcrumb-root'
                  ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400'
                  : !currentFolderId
                  ? 'text-indigo-400 font-semibold'
                  : 'hover:text-white'
              }`}
            >
              Root
            </button>
            {breadcrumbs.map((b, idx) => {
              const isOver = dragOverFolderId === `breadcrumb-${b.id}`;
              return (
                <React.Fragment key={b.id}>
                  <span>/</span>
                  <button
                    onClick={() => onSelectFolder(b.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverFolderId !== `breadcrumb-${b.id}`) setDragOverFolderId(`breadcrumb-${b.id}`);
                    }}
                    onDragLeave={() => {
                      if (dragOverFolderId === `breadcrumb-${b.id}`) setDragOverFolderId(null);
                    }}
                    onDrop={(e) => handleFolderDrop(e, b.id)}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      isOver
                        ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-400'
                        : idx === breadcrumbs.length - 1
                        ? 'text-indigo-400 font-semibold'
                        : 'hover:text-white'
                    }`}
                  >
                    {b.folder_name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-600/80 transition-colors"
            title="View keyboard shortcuts (Ctrl+A, F2, Delete)"
          >
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>
          <button
            type="button"
            id="file-manager-upload-btn"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
          <button
            type="button"
            id="file-manager-newfolder-btn"
            onClick={onOpenNewFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-750 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" /> New Folder
          </button>
        </div>
      </div>

      {/* Toolbar: Select All Checkbox, Search, Sort & View Mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Select All Checkbox Button */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              isAllSelected
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Select all files in view (Ctrl+A)"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-white" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span className="hidden sm:inline">Select All</span>
          </button>

          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter current view..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center border border-slate-700 rounded-xl bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => toggleSort('date')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                sortBy === 'date' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Date
            </button>
            <button
              onClick={() => toggleSort('name')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                sortBy === 'name' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => toggleSort('size')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                sortBy === 'size' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Size
            </button>
          </div>
        </div>

        {/* Batch Operations Controls in Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors ${
                selectedFileIds.size > 0
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-750 text-slate-400'
              }`}
            >
              {selectedFileIds.size} Selected
            </span>

            {/* Batch Download Button */}
            <button
              type="button"
              id="toolbar-batch-download-btn"
              disabled={selectedFileIds.size === 0}
              onClick={handleTriggerBatchDownload}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFileIds.size > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer'
                  : 'text-slate-500 bg-slate-750/50 cursor-not-allowed opacity-60'
              }`}
              title={
                selectedFileIds.size > 0
                  ? `Download ${selectedFileIds.size} selected file(s)`
                  : 'Select files to batch download'
              }
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>

            {/* Batch Move Button */}
            <button
              type="button"
              id="toolbar-batch-move-btn"
              disabled={selectedFileIds.size === 0}
              onClick={() => setBatchMoveOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFileIds.size > 0
                  ? 'bg-slate-700 hover:bg-slate-650 text-amber-300 border border-amber-500/30 cursor-pointer'
                  : 'text-slate-500 bg-slate-750/50 cursor-not-allowed opacity-60'
              }`}
              title={
                selectedFileIds.size > 0
                  ? `Move ${selectedFileIds.size} selected file(s) into a folder`
                  : 'Select files to batch move'
              }
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Move</span>
            </button>

            {/* Batch Delete Button */}
            <button
              type="button"
              id="toolbar-batch-delete-btn"
              disabled={selectedFileIds.size === 0}
              onClick={handleTriggerBatchDelete}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFileIds.size > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer'
                  : 'text-slate-500 bg-slate-750/50 cursor-not-allowed opacity-60'
              }`}
              title={
                selectedFileIds.size > 0
                  ? `Delete ${selectedFileIds.size} selected file(s) (Delete key)`
                  : 'Select files to batch delete'
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Delete</span>
            </button>

            {selectedFileIds.size > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Clear selection (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center border border-slate-700 rounded-xl bg-slate-800 p-0.5">
            <button
              type="button"
              id="viewmode-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="viewmode-list"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subfolders in Current Directory with Drag-and-Drop Move Support */}
      {(childFolders.length > 0 || currentFolderId !== null) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Folders {childFolders.length > 0 ? `(${childFolders.length})` : ''}
            </div>
            {draggingFileIds.length > 0 && (
              <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1 animate-pulse">
                <Move className="w-3 h-3" /> Drop file(s) onto any folder to move
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* If in a subfolder, show Parent Folder tile as drop target */}
            {currentFolderId !== null && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverFolderId !== 'parent-dir') setDragOverFolderId('parent-dir');
                }}
                onDragLeave={() => {
                  if (dragOverFolderId === 'parent-dir') setDragOverFolderId(null);
                }}
                onDrop={(e) => handleFolderDrop(e, currentFolder?.parent_folder_id || null)}
                onClick={() => onSelectFolder(currentFolder?.parent_folder_id || null)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all group cursor-pointer ${
                  dragOverFolderId === 'parent-dir'
                    ? 'bg-indigo-900/80 border-indigo-400 ring-4 ring-indigo-500/50 scale-[1.03] shadow-lg'
                    : draggingFileIds.length > 0
                    ? 'bg-slate-800/90 border-dashed border-indigo-500/60 hover:bg-slate-750'
                    : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700/80 text-slate-300 flex items-center justify-center shrink-0 shadow-xs">
                  <CornerLeftUp className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {dragOverFolderId === 'parent-dir' ? 'Drop to move up' : '.. (Parent Folder)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {dragOverFolderId === 'parent-dir' ? 'Release to drop' : 'Up one level'}
                  </div>
                </div>
              </div>
            )}

            {childFolders.map((folder) => {
              const isOver = dragOverFolderId === folder.id;
              return (
                <div
                  key={folder.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverFolderId !== folder.id) setDragOverFolderId(folder.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                  }}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  onClick={() => onSelectFolder(folder.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all group cursor-pointer relative ${
                    isOver
                      ? 'bg-indigo-900/80 border-indigo-400 ring-4 ring-indigo-500/50 scale-[1.04] shadow-xl z-10'
                      : draggingFileIds.length > 0
                      ? 'bg-slate-800/90 border-dashed border-indigo-500/70 hover:bg-slate-750'
                      : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: `${folder.color || '#3B82F6'}25`,
                      color: folder.color || '#3B82F6',
                    }}
                  >
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {isOver ? `✨ Move Here` : folder.folder_name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {isOver ? `Drop to move files` : `${folder.file_count ?? 0} files`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FolderTree className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No resources found in this view</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Upload files or videos from your mobile phone or computer to organize your teaching materials.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Upload Now
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View with Multi-Select Checkboxes */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.has(file.id);
            const isOffline = cachedFileIds.has(file.id);
            const isDragging = draggingFileIds.includes(file.id);

            return (
              <div
                key={file.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragEnd={handleDragEnd}
                className={`bg-slate-800/80 border rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md relative cursor-grab active:cursor-grabbing ${
                  isDragging ? 'opacity-40 scale-95 border-indigo-400 ring-2 ring-indigo-500/30' : ''
                } ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/40'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Top bar with Selection Checkbox, thumbnail/icon and menu */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Multi-Select Checkbox */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        onClick={(e) => toggleSelectFile(file.id, e)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs ring-2 ring-indigo-400/40'
                            : 'border-slate-500/80 bg-slate-900/90 hover:border-indigo-400 hover:bg-slate-800'
                        }`}
                        title={isSelected ? 'Deselect file' : 'Select file'}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3] text-white" />}
                      </button>

                      <div
                        onClick={() => onPreview(file)}
                        className="cursor-pointer"
                        title="Click to preview file"
                      >
                        <DynamicFileIcon
                          fileName={file.file_name}
                          extension={file.file_extension}
                          mimeType={file.mime_type}
                          fileType={file.file_type}
                          size="md"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOffline && (
                        <span
                          className="text-emerald-400 p-1"
                          title="Available offline in IndexedDB storage"
                        >
                          <CloudCheck className="w-3.5 h-3.5" />
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(file)}
                        className={`p-1 rounded-lg transition-colors ${
                          file.is_favorite
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={file.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
                      >
                        <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-current' : ''}`} />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id)
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                          title="File Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuFileId === file.id && (
                          <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 text-xs">
                            <button
                              onClick={() => {
                                onPreview(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" /> Preview / Open
                            </button>
                            <button
                              onClick={() => {
                                onDownload(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" /> Download
                            </button>
                            <button
                              onClick={() => {
                                onRename(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-400" /> Rename (F2)
                            </button>
                            <button
                              onClick={() => {
                                onMove(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                            >
                              <FolderInput className="w-3.5 h-3.5 text-amber-400" /> Move to Folder
                            </button>
                            <button
                              onClick={() => {
                                onCopy(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-purple-400" /> Duplicate
                            </button>
                            <button
                              onClick={() => {
                                onShare(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                            >
                              <Share2 className="w-3.5 h-3.5 text-cyan-400" /> Permissions
                            </button>
                            <button
                              onClick={() => {
                                onShowInfo(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center gap-2"
                            >
                              <Info className="w-3.5 h-3.5 text-slate-400" /> File Info
                            </button>
                            <div className="border-t border-slate-700/60 my-1" />
                            <button
                              onClick={() => {
                                onDelete(file);
                                setActiveMenuFileId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Move to Trash (Del)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => onPreview(file)}
                    className="cursor-pointer"
                    title={file.file_name}
                  >
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-white line-clamp-2 break-all mb-1">
                      {file.file_name}
                    </h4>
                  </div>
                </div>

                {/* Footer Meta */}
                <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>{formatBytes(file.file_size)}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300">
                      {file.file_extension}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      {file.device.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Laptop className="w-3 h-3 text-blue-400" />
                      )}
                      <span className="truncate max-w-[100px]">{file.device}</span>
                    </span>
                    <span>{formatDate(file.uploaded_at)}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 truncate">
                    Owner: <span className="text-slate-400">{file.owner_name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View with Multi-Select Checkboxes */
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isAllSelected}
                      onClick={toggleSelectAll}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all mx-auto cursor-pointer ${
                        isAllSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                          : 'border-slate-500/80 bg-slate-900 hover:border-indigo-400'
                      }`}
                      title={isAllSelected ? 'Deselect all' : 'Select all (Ctrl+A)'}
                    >
                      {isAllSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                    </button>
                  </th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Device Source</th>
                  <th className="py-3 px-3">Uploaded</th>
                  <th className="py-3 px-3">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.has(file.id);
                  const isOffline = cachedFileIds.has(file.id);
                  const isDragging = draggingFileIds.includes(file.id);

                  return (
                    <tr
                      key={file.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, file)}
                      onDragEnd={handleDragEnd}
                      className={`hover:bg-slate-750/50 transition-colors group cursor-grab active:cursor-grabbing ${
                        isDragging ? 'opacity-40 bg-indigo-950/40' : ''
                      } ${
                        isSelected ? 'bg-indigo-950/25' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isSelected}
                          onClick={() => toggleSelectFile(file.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all mx-auto cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                              : 'border-slate-500/80 bg-slate-900 hover:border-indigo-400'
                          }`}
                          title={isSelected ? 'Deselect file' : 'Select file'}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] text-white" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(file)}
                            className={
                              file.is_favorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                            }
                          >
                            <Star className={`w-3.5 h-3.5 ${file.is_favorite ? 'fill-current' : ''}`} />
                          </button>
                          <div
                            onClick={() => onPreview(file)}
                            className="cursor-pointer flex items-center gap-2.5 min-w-0"
                          >
                            <DynamicFileIcon
                              fileName={file.file_name}
                              extension={file.file_extension}
                              mimeType={file.mime_type}
                              fileType={file.file_type}
                              size="sm"
                              showBadge={false}
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-200 group-hover:text-white truncate max-w-xs block">
                                {file.file_name}
                              </span>
                            </div>
                            {isOffline && (
                              <CloudCheck
                                className="w-3 h-3 text-emerald-400 shrink-0"
                                title="Cached in IndexedDB"
                              />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {(() => {
                          const meta = getFileFormatMeta(file.file_name, file.mime_type, file.file_type);
                          return (
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${meta.badgeBg} shadow-2xs`}>
                              {meta.extension}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {formatBytes(file.file_size)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                          {file.device.toLowerCase().includes('mobile') ? (
                            <Smartphone className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Laptop className="w-3 h-3 text-blue-400" />
                          )}
                          {file.device}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {formatDate(file.uploaded_at)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {file.owner_name}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onPreview(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownload(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRename(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(file)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Move Modal */}
      {batchMoveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderInput className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Batch Move Resources</h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchMoveOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Moving <strong className="text-white">{selectedFileIds.size}</strong> selected resource(s).
              Select destination folder:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:bg-slate-800/80 cursor-pointer">
                <input
                  type="radio"
                  name="targetFolder"
                  value="root"
                  checked={batchMoveTarget === 'root'}
                  onChange={() => setBatchMoveTarget('root')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-white">Root Directory (No folder)</div>
                  <div className="text-slate-400">Primary repository storage</div>
                </div>
              </label>

              {folders.map((folder) => (
                <label
                  key={folder.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 hover:bg-slate-800/80 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="targetFolder"
                    value={folder.id}
                    checked={batchMoveTarget === folder.id}
                    onChange={() => setBatchMoveTarget(folder.id)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-indigo-400" /> {folder.folder_name}
                    </div>
                    <div className="text-slate-400">{folder.file_count ?? 0} files currently</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBatchMoveOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerBatchMove}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Move {selectedFileIds.size} File(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Reference Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Use these shortcuts in the File Manager to speed up teaching workflow:
            </p>

            <div className="space-y-2 text-xs divide-y divide-slate-800">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Select All Files</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-indigo-300 font-bold">
                  Ctrl + A / ⌘ + A
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Delete / Trash Selected File(s)</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-rose-300 font-bold">
                  Delete / Backspace
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Rename Selected File</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-blue-300 font-bold">
                  F2
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Preview / Open Selected File</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-emerald-300 font-bold">
                  Space / Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">Deselect All / Close Menus</span>
                <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded font-mono text-slate-300 font-bold">
                  Esc
                </kbd>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context-Aware Floating Action Bar (Appears when multiple files are selected) */}
      <AnimatePresence>
        {selectedFileIds.size > 1 && (
          <motion.div
            id="floating-batch-toolbar"
            role="toolbar"
            aria-label="Batch Actions Floating Toolbar"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border-2 border-indigo-500/80 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-2xl shadow-indigo-950/80 backdrop-blur-xl flex items-center gap-2 sm:gap-3 text-xs max-w-[95vw] overflow-x-auto"
          >
            {/* Selection Counter Pill */}
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80 shrink-0">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                {selectedFileIds.size}
              </span>
              <span className="font-semibold text-white whitespace-nowrap hidden sm:inline">
                {selectedFileIds.size} files selected
              </span>
            </div>

            {/* Quick Action: Batch Download */}
            <button
              type="button"
              id="batch-download-btn"
              onClick={handleTriggerBatchDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-all shadow-sm hover:scale-[1.02] cursor-pointer whitespace-nowrap shrink-0"
              title="Batch download all selected files"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Batch Download ({selectedFileIds.size})</span>
            </button>

            {/* Quick Action: Batch Move */}
            <button
              type="button"
              id="batch-move-btn"
              onClick={() => setBatchMoveOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-amber-300 border border-amber-500/40 font-semibold transition-all shadow-sm hover:scale-[1.02] cursor-pointer whitespace-nowrap shrink-0"
              title="Batch move all selected files into a folder"
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>Batch Move ({selectedFileIds.size})</span>
            </button>

            {/* Quick Action: Batch Delete */}
            <button
              type="button"
              id="batch-delete-btn"
              onClick={handleTriggerBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold transition-all shadow-sm hover:scale-[1.02] cursor-pointer whitespace-nowrap shrink-0"
              title="Batch delete or trash all selected files"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Batch Delete ({selectedFileIds.size})</span>
            </button>

            {/* Quick Action: Deselect All */}
            <button
              type="button"
              id="batch-clear-selection-btn"
              onClick={clearSelection}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer shrink-0"
              title="Clear selection (Esc)"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
