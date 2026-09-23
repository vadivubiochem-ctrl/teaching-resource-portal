import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Bell,
  HardDrive,
  LogOut,
  Laptop,
  Smartphone,
  ChevronDown,
  User as UserIcon,
  Shield,
  CheckCircle,
  Menu,
} from 'lucide-react';
import type { User } from '../types.js';
import { formatBytes } from '../utils/formatters.js';
import { getSimulatedDevice, setSimulatedDevice } from '../services/api.js';

interface NavbarProps {
  user?: User | null;
  currentDevice?: string;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  onDeviceChange?: (dev: string) => void;
  onNavigate?: (tab: string) => void;
  onElevateAdmin?: () => void;
  onOpenRules?: () => void;
  onOpenCrossDeviceModal?: () => void;
  storageUsed?: number;
  storageLimit?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentDevice: propDevice,
  onLogout,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  onToggleMobileSidebar,
  onDeviceChange,
  onNavigate,
  onElevateAdmin,
  onOpenRules,
  onOpenCrossDeviceModal,
  storageUsed,
  storageLimit,
}) => {
  const [currentDevice, setCurrentDevice] = useState(propDevice || getSimulatedDevice());
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync propDevice if passed
  useEffect(() => {
    if (propDevice) {
      setCurrentDevice(propDevice);
    }
  }, [propDevice]);

  const effectiveStorageUsed = storageUsed ?? user?.storage_used ?? 0;
  const effectiveStorageLimit = storageLimit ?? user?.storage_limit ?? 16106127360;
  const storagePercentage = Math.min(
    100,
    Math.round((effectiveStorageUsed / (effectiveStorageLimit || 1)) * 100)
  );
  const toggleMobileNav = onToggleMobileSidebar || onToggleSidebar;

  const changeDevice = (dev: string) => {
    setCurrentDevice(dev);
    setSimulatedDevice(dev);
    setShowDeviceDropdown(false);
    if (onDeviceChange) onDeviceChange(dev);
  };

  const username = user?.username || 'Teacher';
  const email = user?.email || 'teacher@teacherhub.edu';
  const role = user?.role || 'teacher';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="mobile-sidebar-toggle"
            onClick={toggleMobileNav}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Teacher Resource Hub
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                  Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Cross-Device School Repository</p>
            </div>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="global-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files, lessons, subjects, teachers..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Controls, Device simulation, Storage, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Device Indicator & Switcher */}
          <div className="relative">
            <button
              type="button"
              id="device-selector-btn"
              onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-all shadow-sm"
              title="Change active device (simulates uploading from mobile vs desktop)"
            >
              {currentDevice.toLowerCase().includes('mobile') ? (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden lg:inline">{currentDevice}</span>
              <span className="lg:hidden text-[11px] font-semibold">
                {currentDevice.toLowerCase().includes('mobile') ? 'Mobile' : 'Desktop'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showDeviceDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  Switch Active Device Simulator
                </div>
                <button
                  type="button"
                  onClick={() => changeDevice('Desktop (Windows 11 PC)')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-blue-400" /> Desktop Computer (Windows/Mac)
                  </span>
                  {currentDevice.includes('Desktop') && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => changeDevice('Mobile (Android Phone)')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> Mobile Phone (Android)
                  </span>
                  {currentDevice.includes('Android') && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => changeDevice('Mobile (iPhone 15 Pro)')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" /> Mobile Phone (iPhone)
                  </span>
                  {currentDevice.includes('iPhone') && <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Connect Mobile / Cross-Device Guide Button */}
          {onOpenCrossDeviceModal && (
            <button
              type="button"
              id="cross-device-guide-btn"
              onClick={onOpenCrossDeviceModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-medium text-indigo-300 hover:text-white transition-all shadow-sm"
              title="View instructions to open on mobile phone & computer"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Phone & PC Link</span>
            </button>
          )}

          {/* Storage mini meter */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <div className="w-20 bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  storagePercentage > 85 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">
              {formatBytes(effectiveStorageUsed)} / {formatBytes(effectiveStorageLimit)}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              id="notifications-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-slate-900" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-xs font-semibold text-slate-200">
                  <span>Recent Cloud Events</span>
                  <span className="text-[11px] text-indigo-400">All synced</span>
                </div>
                <div className="divide-y divide-slate-700/50 max-h-60 overflow-y-auto mt-2">
                  <div className="py-2 text-xs">
                    <div className="text-slate-200 font-medium flex items-center gap-1.5">
                      <Smartphone className="w-3 h-3 text-emerald-400" /> Cross-device upload synced
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Class_12_Lesson_5.mp4 uploaded from mobile is ready for streaming on desktop.
                    </p>
                    <span className="text-[10px] text-slate-500">10 mins ago</span>
                  </div>
                  <div className="py-2 text-xs">
                    <div className="text-slate-200 font-medium flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-indigo-400" /> Central Backup Verified
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Teaching Resources repository backed up to central server storage.
                    </p>
                    <span className="text-[10px] text-slate-500">2 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              id="user-profile-menu-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-slate-200 leading-none">{username}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 capitalize flex items-center gap-1">
                  {role === 'admin' ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  ) : (
                    <span>Teacher</span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50">
                <div className="px-3.5 py-2 border-b border-slate-700">
                  <div className="text-xs font-bold text-white">{username}</div>
                  <div className="text-[11px] text-slate-400 truncate">{email}</div>
                  <div className="mt-1 text-[10px] inline-block px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium capitalize">
                    Role: {role}
                  </div>
                </div>

                <div className="px-3.5 py-2 border-b border-slate-700 text-xs text-slate-300">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span>Storage Usage</span>
                    <span>{storagePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${storagePercentage}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatBytes(effectiveStorageUsed)} of {formatBytes(effectiveStorageLimit)} used
                  </div>
                </div>

                {role === 'admin' ? (
                  <div className="py-1 border-b border-slate-700">
                    <button
                      type="button"
                      id="navbar-admin-storage-btn"
                      onClick={() => {
                        setShowUserDropdown(false);
                        if (onNavigate) onNavigate('admin-storage');
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Storage Management
                    </button>
                  </div>
                ) : (
                  <div className="py-2 px-3.5 border-b border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Account Role:</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        Multi-User Teacher
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Admin rights disabled by institutional policy.
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  id="user-logout-btn"
                  onClick={onLogout}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 mt-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar for small phones */}
      <div className="mt-2.5 sm:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="mobile-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search resources, videos, docs..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </header>
  );
};
