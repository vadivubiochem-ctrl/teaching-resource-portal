import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  ShieldCheck,
  ExternalLink,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  X,
  QrCode,
  Globe,
} from 'lucide-react';

interface CrossDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  devUrl?: string;
  shareUrl?: string;
  userEmail?: string;
}

export const CrossDeviceModal: React.FC<CrossDeviceModalProps> = ({
  isOpen,
  onClose,
  devUrl = 'https://ais-dev-t2yv7lwpv6cvormu65d6tk-441091294119.asia-southeast1.run.app',
  shareUrl = 'https://ais-pre-t2yv7lwpv6cvormu65d6tk-441091294119.asia-southeast1.run.app',
  userEmail = 'vadivubiochem@gmail.com',
}) => {
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, isDev: boolean) => {
    navigator.clipboard.writeText(text);
    if (isDev) {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2000);
    } else {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Generate QR code URL using a public QR image API for quick phone camera scanning
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    devUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Cross-Device Access & Instructions</h2>
              <p className="text-xs text-slate-400">Opening on Mobile Phone & Desktop Computer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Why 403 Google Error Happens */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Fixing the "Google 403: You do not have access" Error</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-normal">
              The development preview link is restricted by Google AI Studio's security gateway. If your phone or desktop browser is not logged into Google with your developer email (<strong>{userEmail}</strong>), Google displays <strong>403 Access Denied</strong>.
            </p>
          </div>

          {/* Option 1: Log in with your Google Account */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-white">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Option A: Sign in with your Google Account on that device</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                Immediate
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              On your mobile phone's browser (Chrome or Safari), open <strong>google.com</strong> and sign in as:
            </p>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-indigo-300 text-[11px] flex items-center justify-between">
              <span>{userEmail}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-400 text-[11px]">
              After signing in, scan the QR code below or open the live link:
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="Scan with phone"
                  className="w-24 h-24"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-[10px] text-slate-400">Live Development Link:</div>
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={devUrl}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(devUrl, true)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    {copiedDev ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDev ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Publish with AI Studio "Share" button */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Option B: Click "Share" in AI Studio (Public Link)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Recommended
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Click the <strong>Share</strong> button at the top-right corner of the Google AI Studio page. This deploys a public version (<code>ais-pre-...</code>) that allows ANY mobile or desktop browser to open it without Google sign-in restrictions.
            </p>
          </div>

          {/* Option 3: Built-in Device Switcher */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-white">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Option C: Use the In-App Device Switcher</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                Instant Test
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              You can test the full mobile-to-desktop workflow directly in this tab:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
              <li>Use the <strong>Device Switcher</strong> in the top navigation bar to select <strong>📱 Mobile (Android Phone)</strong>.</li>
              <li>Upload your 2 files. The system records them with a mobile device tag.</li>
              <li>Switch back to <strong>💻 Desktop Computer</strong>. The uploaded files are listed and ready to download immediately.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
