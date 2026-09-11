import React from 'react';
import { Table, FileText, Loader2, Sparkles } from 'lucide-react';

interface DocumentLoadingSkeletonProps {
  type: 'spreadsheet' | 'pdf' | 'word';
  fileName?: string;
  fileSize?: number;
}

export const DocumentLoadingSkeleton: React.FC<DocumentLoadingSkeletonProps> = ({
  type,
  fileName,
  fileSize,
}) => {
  const formattedSize = fileSize
    ? fileSize > 1024 * 1024
      ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(fileSize / 1024)} KB`
    : undefined;

  if (type === 'spreadsheet') {
    const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const rows = Array.from({ length: 15 }, (_, i) => i + 1);

    // Pre-calculated diverse bar widths for realistic spreadsheet appearance
    const getCellWidth = (r: number, c: number) => {
      const hash = (r * 7 + c * 13) % 5;
      if (hash === 0) return 'w-3/4';
      if (hash === 1) return 'w-1/2';
      if (hash === 2) return 'w-4/5';
      if (hash === 3) return 'w-2/5';
      return 'w-2/3';
    };

    return (
      <div className="w-full max-w-6xl bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[75vh] select-none">
        {/* 1. TOP EXCEL TITLE & ACTION BAR SKELETON */}
        <div className="bg-[#107c41] px-4 py-2.5 flex items-center justify-between text-white border-b border-[#0d6535]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-md">
              <Table className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-wide text-white truncate max-w-sm">
                  {fileName || 'Loading Spreadsheet Workbook...'}
                </span>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded text-white/90">
                  Excel Engine
                </span>
              </div>
              <p className="text-[11px] text-white/80">
                {formattedSize ? `${formattedSize} • ` : ''}Parsing rows, columns, formulas & hyperlinks...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-24 bg-white/20 rounded-lg animate-pulse" />
            <div className="h-7 w-28 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* 2. FORMULA BAR SKELETON */}
        <div className="bg-[#f8fafc] border-b border-slate-300 px-3 py-1.5 flex items-center gap-3 text-xs">
          <div className="w-14 h-6 bg-slate-200 rounded border border-slate-300 flex items-center justify-center font-mono text-[11px] text-slate-500 font-bold">
            A1
          </div>
          <div className="text-slate-400 font-serif italic font-bold select-none text-xs">
            fx
          </div>
          <div className="flex-1 h-6 bg-slate-200/80 rounded border border-slate-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
          </div>
        </div>

        {/* 3. SPREADSHEET TABLE GRID SKELETON WITH FLOATING STATUS CARD */}
        <div className="flex-1 overflow-hidden bg-slate-100 p-2 relative">
          {/* Centered Floating Status Card */}
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
            <div className="bg-white/95 border border-emerald-200/80 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-3 max-w-md mx-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Table className="w-6 h-6 text-[#107c41]" />
                </div>
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin absolute -top-1 -right-1" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Parsing Spreadsheet Workbook</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Scanning cell bounds, formatting numbers, currency, dates, and hyperlinked resources...
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                <span>Preserving authentic grid layout & styles</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-300 shadow-xs h-full overflow-hidden">
            <table className="border-collapse table-fixed w-full text-xs">
              {/* Header Row */}
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-slate-300">
                  <th className="w-12 h-7 border-r border-slate-300 bg-[#e2e8f0] text-center" />
                  {colLetters.map((letter) => (
                    <th
                      key={letter}
                      className="h-7 border-r border-slate-300 text-center font-normal text-[11px] text-slate-600 bg-[#f1f5f9]"
                    >
                      {letter}
                    </th>
                  ))}
                </tr>
              </thead>
              {/* Data Rows Skeleton */}
              <tbody>
                {rows.map((rowNum) => (
                  <tr key={rowNum} className="border-b border-slate-200">
                    <td className="w-12 h-7 border-r border-slate-300 bg-[#f8fafc] text-center font-normal text-[11px] text-slate-500">
                      {rowNum}
                    </td>
                    {colLetters.map((letter, cIdx) => (
                      <td key={letter} className="h-7 border-r border-slate-200 px-2 py-1 align-middle">
                        <div
                          className={`h-3 bg-slate-200/80 rounded animate-pulse ${getCellWidth(
                            rowNum,
                            cIdx
                          )}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. BOTTOM TABS BAR SKELETON */}
        <div className="bg-[#f1f5f9] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-white border border-slate-300 rounded-t px-2 flex items-center gap-1">
              <div className="h-2.5 w-12 bg-slate-300 rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-t px-2 flex items-center gap-1 opacity-70">
              <div className="h-2.5 w-10 bg-slate-300 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // PDF SKELETON
  return (
    <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[75vh] select-none">
      {/* PDF Toolbar Skeleton */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-rose-400" />
          <span className="font-semibold text-white truncate max-w-xs">
            {fileName || 'Loading PDF Document...'}
          </span>
          <div className="h-6 w-32 bg-slate-800 rounded-md animate-pulse hidden sm:block" />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-7 w-20 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-7 w-28 bg-rose-600/40 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* PDF Document Viewport with Page Sheet Canvas */}
      <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-start overflow-y-auto relative">
        {/* Floating status card */}
        <div className="absolute top-10 z-30 bg-slate-900/95 border border-rose-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-3 text-left max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-xs">Rendering Document Pages</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Preparing vector text layers and academic outline...
            </p>
          </div>
        </div>

        {/* Realistic Simulated Paper Page */}
        <div className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded-xl shadow-2xl min-h-[520px] space-y-6 mt-4">
          {/* Header section skeleton */}
          <div className="border-b-2 border-slate-200 pb-4 space-y-2">
            <div className="h-3 w-40 bg-rose-200 rounded animate-pulse" />
            <div className="h-6 w-3/4 bg-slate-300 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-slate-200 rounded" />
          </div>

          {/* Section 1 skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-48 bg-slate-300 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-11/12 bg-slate-100 rounded" />
              <div className="h-3 w-4/5 bg-slate-100 rounded" />
            </div>
          </div>

          {/* Callout box skeleton */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="h-3 w-32 bg-slate-300 rounded animate-pulse" />
            <div className="h-8 w-full bg-white border border-slate-200 rounded animate-pulse" />
          </div>

          {/* Section 2 skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-52 bg-slate-300 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-5/6 bg-slate-100 rounded" />
              <div className="h-3 w-3/4 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
