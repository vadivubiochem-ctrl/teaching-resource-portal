import React, { useState } from 'react';
import { Share2, X, Lock, Globe, Shield, Users, UserCheck, Check } from 'lucide-react';
import type { TeachingFile } from '../types.js';
import { LocalStore } from '../services/store.js';

interface ShareModalProps {
  file: TeachingFile | null;
  onClose: () => void;
  onSaveShare: (fileId: string, sharedUserId?: string, permission?: 'view' | 'edit', sharedMode?: string) => Promise<void>;
}

export const ShareModal: React.FC<ShareModalProps> = ({ file, onClose, onSaveShare }) => {
  const activeTeachers = LocalStore.getUsers()
    .filter((u) => u.status === 'active' && u.schoolId === (file?.schoolId || 'SCH_PANNAIPURAM'))
    .map((u) => ({
      id: u.id,
      name: u.username,
      email: u.email,
      dept: u.department || 'Faculty',
    }));

  const [mode, setMode] = useState<'private' | 'shared_users' | 'all_teachers' | 'admin_only'>(
    file?.shared_mode || 'private'
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState(activeTeachers[0]?.id || '');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!file) return null;

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSaveShare(
        file.id,
        mode === 'shared_users' ? selectedTeacherId : undefined,
        permission,
        mode
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sharing & Permissions</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{file.file_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Access Level
            </label>

            {/* Option 1: Private */}
            <div
              onClick={() => setMode('private')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                mode === 'private'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-xs font-bold">Private</div>
                  <div className="text-[11px] text-slate-400">Only you can view and download</div>
                </div>
              </div>
              {mode === 'private' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>

            {/* Option 2: Shared with selected users */}
            <div
              onClick={() => setMode('shared_users')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                mode === 'shared_users'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-bold">Shared with Selected Teachers</div>
                  <div className="text-[11px] text-slate-400">Choose specific colleagues from the directory</div>
                </div>
              </div>
              {mode === 'shared_users' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>

            {/* Option 3: Shared with all teachers */}
            <div
              onClick={() => setMode('all_teachers')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                mode === 'all_teachers'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold">Shared with All Teachers</div>
                  <div className="text-[11px] text-slate-400">Visible in hub repository for every faculty member</div>
                </div>
              </div>
              {mode === 'all_teachers' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>

            {/* Option 4: Admin Only */}
            <div
              onClick={() => setMode('admin_only')}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                mode === 'admin_only'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold">Admin Only</div>
                  <div className="text-[11px] text-slate-400">Confidential resource restricted to administrators</div>
                </div>
              </div>
              {mode === 'admin_only' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
          </div>

          {/* If selected teachers mode is active */}
          {mode === 'shared_users' && (
            <div className="p-3.5 bg-slate-800 rounded-xl border border-slate-700 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Select Teacher
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  {activeTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email}) - {t.dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Permission Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPermission('view')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      permission === 'view'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    Can View / Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setPermission('edit')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      permission === 'edit'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    Can Edit / Replace
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              {submitting ? 'Applying...' : success ? 'Saved!' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
