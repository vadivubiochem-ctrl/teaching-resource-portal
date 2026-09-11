import React from 'react';
import { LayoutDashboard, FolderTree, Video, Upload, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: any) => void;
  onOpenUpload: () => void;
  onToggleMobileSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenUpload,
  onToggleMobileSidebar,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around">
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Dashboard</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('my-resources')}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentTab === 'my-resources' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <FolderTree className="w-5 h-5" />
        <span>Resources</span>
      </button>

      {/* Floating Center Upload Button for Mobile */}
      <button
        type="button"
        id="mobile-nav-upload-trigger"
        onClick={onOpenUpload}
        className="-mt-5 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 border-2 border-slate-900 transition-transform active:scale-95"
        title="Upload File"
      >
        <Upload className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => onNavigate('videos')}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
          currentTab === 'videos' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
        }`}
      >
        <Video className="w-5 h-5" />
        <span>Videos</span>
      </button>

      <button
        type="button"
        onClick={onToggleMobileSidebar}
        className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-slate-400 hover:text-white"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </div>
  );
};
