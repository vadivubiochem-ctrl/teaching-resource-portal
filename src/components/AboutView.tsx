import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Building2,
  Phone,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface AboutViewProps {
  onCopyNotice?: (msg: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onCopyNotice }) => {
  const [copied, setCopied] = useState(false);
  const phoneNumber = '7603930445';
  const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(
    'Hello P. Siva Sir, I am contacting you regarding the Teacher Resource Hub portal.'
  )}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(phoneNumber);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = phoneNumber;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (onCopyNotice) {
        onCopyNotice('Phone number 7603930445 copied to clipboard!');
      }
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
      {/* Top Center: Amber Graduation Cap Logo & Elegant Display Title */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-400 shadow-xl shadow-amber-500/20 flex items-center justify-center mb-5 transition-transform hover:scale-105">
          <GraduationCap className="w-11 h-11 sm:w-13 sm:h-13 text-slate-950 fill-slate-950 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-400 tracking-wide drop-shadow-sm">
          App Developer Info
        </h1>
      </div>

      {/* Main Info Card Matching Exactly User Design */}
      <div className="max-w-xl mx-auto rounded-2xl bg-[#0e1b33] border border-blue-900/60 p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* DEVELOPED BY Tag */}
        <div className="text-[11px] font-bold uppercase tracking-widest text-sky-400 font-mono mb-4">
          DEVELOPED BY
        </div>

        {/* Profile Details Row */}
        <div className="flex items-start gap-4 sm:gap-5">
          {/* Book Icon Box */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-blue-800/80 bg-blue-950/60 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <BookOpen className="w-6 h-6 text-amber-400" />
          </div>

          {/* Teacher Credentials */}
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              P. SIVA
            </h2>
            <div className="text-amber-400 font-semibold text-xs sm:text-sm tracking-wide">
              M.Sc., B.Ed., M.Phil., MCA.
            </div>
            <div className="text-slate-300 text-xs sm:text-sm font-medium">
              PG Computer Science Teacher
            </div>
            <div className="flex items-center gap-1.5 text-slate-200 text-xs sm:text-sm font-medium pt-1">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Govt Hr Sec School, Pannaipuram</span>
            </div>
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="h-px w-full bg-blue-900/50 my-6" />

        {/* Cell No & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Phone Details */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl border border-blue-800/80 bg-blue-950/60 text-amber-400 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-sky-400 font-mono">
                CELL NO
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono tracking-wider">
                {phoneNumber}
              </div>
            </div>
          </div>

          {/* Buttons: Copy & WhatsApp */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Copy Button */}
            <button
              type="button"
              id="about-copy-phone-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-950/80 hover:bg-blue-900/90 border border-blue-700/60 text-blue-200 transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* WhatsApp Direct Chat Button */}
            <a
              id="about-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#128C7E] hover:bg-[#075E54] text-white shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#128C7E]" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Institutional Mission & Hub Context Note */}
      <div className="max-w-xl mx-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-indigo-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Teacher Resource Hub &bull; Cloud Repository Portal</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Dedicated digital learning and teaching resource infrastructure designed to facilitate seamless curriculum file sharing, offline study material delivery, and institutional governance across schools.
        </p>
      </div>
    </div>
  );
};
