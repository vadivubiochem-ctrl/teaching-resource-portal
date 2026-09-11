import React, { useState } from 'react';
import { Folder, FolderPlus, X, Palette, FolderTree } from 'lucide-react';
import type { Folder as FolderType } from '../types.js';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  parentFolderId: string | null;
  editingFolder?: FolderType | null;
  onCreateFolder: (name: string, parentId: string | null, color: string) => Promise<void>;
  onUpdateFolder?: (id: string, name: string, parentId: string | null, color: string) => Promise<void>;
}

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#0EA5E9', // Sky
  '#EF4444', // Red
];

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  folders,
  parentFolderId,
  editingFolder,
  onCreateFolder,
  onUpdateFolder,
}) => {
  const [name, setName] = useState(editingFolder ? editingFolder.folder_name : '');
  const [parentId, setParentId] = useState<string | null>(
    editingFolder ? editingFolder.parent_folder_id : parentFolderId
  );
  const [color, setColor] = useState(editingFolder?.color || '#3B82F6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a folder name.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingFolder && onUpdateFolder) {
        await onUpdateFolder(editingFolder.id, name.trim(), parentId, color);
      } else {
        await onCreateFolder(name.trim(), parentId, color);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save folder.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {editingFolder ? 'Rename / Move Folder' : 'Create New Folder'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 12, Lesson 5, PPT"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Parent Folder Location
            </label>
            <select
              value={parentId || 'root'}
              onChange={(e) => setParentId(e.target.value === 'root' ? null : e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="root">📁 Root (Top Level Directory)</option>
              {folders
                .filter((f) => !editingFolder || f.id !== editingFolder.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    📂 {f.folder_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Folder Color Accent
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingFolder ? 'Update Folder' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
