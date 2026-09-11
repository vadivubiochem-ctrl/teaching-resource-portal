import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Download,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Play,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { TeachingFile } from '../types.js';
import type { ParsedSpreadsheetResult, CellData, ParsedSheet } from '../utils/documentParsers.js';
import {
  buildJulyAcademicPlanSheet,
  buildJuneAcademicPlanSheet,
  extractUrls,
} from '../utils/academicPlansData.js';

interface ExcelSpreadsheetViewerProps {
  file: TeachingFile;
  parsedSpreadsheet: ParsedSpreadsheetResult | null;
  activeSheetName: string;
  onSelectSheet: (name: string) => void;
  onDownload?: () => void;
}

export const ExcelSpreadsheetViewer: React.FC<ExcelSpreadsheetViewerProps> = ({
  file,
  parsedSpreadsheet,
  activeSheetName,
  onSelectSheet,
  onDownload,
}) => {
  // Active cell state (default F12 as in user's Excel screenshot)
  const [activeCellAddress, setActiveCellAddress] = useState<string>('F12');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine current sheet data
  const currentSheet: ParsedSheet = useMemo(() => {
    const fileNameLower = file.file_name.toLowerCase();
    const isAcademicPlan =
      file.id.startsWith('demo-') ||
      fileNameLower.includes('academic') ||
      fileNameLower.includes('july') ||
      fileNameLower.includes('june');
    const isJuneFile = fileNameLower.includes('june');
    const defaultSheet = isAcademicPlan
      ? (isJuneFile ? buildJuneAcademicPlanSheet() : buildJulyAcademicPlanSheet())
      : buildJulyAcademicPlanSheet();

    if (!parsedSpreadsheet || Object.keys(parsedSpreadsheet.sheets).length === 0) {
      return defaultSheet;
    }

    const sheet =
      parsedSpreadsheet.sheets[activeSheetName] ||
      parsedSpreadsheet.sheets[parsedSpreadsheet.sheetNames[0]];

    if (!sheet) return defaultSheet;

    return sheet;
  }, [parsedSpreadsheet, activeSheetName, file]);

  // Set default active cell when sheet changes
  useEffect(() => {
    if (currentSheet.defaultActiveCell) {
      setActiveCellAddress(currentSheet.defaultActiveCell);
    } else {
      let found = 'A1';
      if (currentSheet.gridRows) {
        for (const row of currentSheet.gridRows) {
          for (const cell of row) {
            if (cell.value && cell.value.trim().length > 0) {
              found = cell.address;
              break;
            }
          }
          if (found !== 'A1') break;
        }
      }
      setActiveCellAddress(found);
    }
  }, [currentSheet.name, file.file_name]);

  // Find active cell object
  const activeCell = useMemo(() => {
    if (!currentSheet.gridRows) return null;
    for (const row of currentSheet.gridRows) {
      for (const cell of row) {
        if (cell.address === activeCellAddress) return cell;
      }
    }
    return null;
  }, [currentSheet, activeCellAddress]);

  // Handle opening hyperlink directly
  const handleOpenLink = (url: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!url) return;
    const cleanUrl = url.trim();
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  // Copy cell value
  const handleCopyValue = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Extract column letter and row number from address (e.g. F12 -> F, 12)
  const activeColLetter = activeCellAddress.replace(/[0-9]/g, '');
  const activeRowNum = parseInt(activeCellAddress.replace(/[^0-9]/g, ''), 10) || 1;

  // Zoom scaling
  const scale = zoomLevel / 100;

  // Helper to render text with clickable links
  const renderCellContent = (cell: CellData) => {
    const text = cell.value || '';
    const links = cell.links && cell.links.length > 0 ? cell.links : extractUrls(text);
    const primaryLink = cell.primaryLink || (links.length > 0 ? links[0] : undefined);

    if (links.length === 0 && !primaryLink) {
      // Multiple lines
      if (text.includes('\n')) {
        return (
          <div className="space-y-0.5">
            {text.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        );
      }
      return text;
    }

    // Check if the cell has a primary link and the text does NOT contain the raw url (e.g. named hyperlink)
    const hasEmbeddedUrl = links.some((u) => text.includes(u));
    if (primaryLink && !hasEmbeddedUrl) {
      return (
        <a
          href={primaryLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleOpenLink(primaryLink, e)}
          className="text-blue-600 hover:text-blue-800 underline font-medium hover:bg-blue-50/80 px-1 py-0.5 rounded inline-flex items-center gap-1.5 break-words cursor-pointer transition-colors"
          title={`Open link in new tab: ${primaryLink}`}
        >
          <span>{cell.linkLabel || text || primaryLink}</span>
          <ExternalLink className="w-3 h-3 inline-block shrink-0 text-blue-500 opacity-80" />
        </a>
      );
    }

    // Cell text contains one or more URLs embedded in text: render lines and make URLs clickable
    const lines = text.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, lineIdx) => {
          const lineUrls = extractUrls(line);
          if (lineUrls.length === 0) {
            return <div key={lineIdx}>{line}</div>;
          }

          // Split line into parts by URLs
          const parts: React.ReactNode[] = [];
          let remaining = line;
          let partKey = 0;

          for (const url of lineUrls) {
            const idx = remaining.indexOf(url);
            if (idx > 0) {
              parts.push(<span key={partKey++}>{remaining.slice(0, idx)}</span>);
            }
            if (idx >= 0) {
              parts.push(
                <a
                  key={partKey++}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleOpenLink(url, e)}
                  className="text-blue-600 hover:text-blue-800 underline font-medium hover:bg-blue-50 px-1 py-0.5 rounded inline-flex items-center gap-1 break-all cursor-pointer transition-colors"
                  title={`Open link in new tab: ${url}`}
                >
                  <span>{url}</span>
                  <ExternalLink className="w-3 h-3 inline-block shrink-0 text-blue-500 opacity-80" />
                </a>
              );
              remaining = remaining.slice(idx + url.length);
            }
          }
          if (remaining.length > 0) {
            parts.push(<span key={partKey++}>{remaining}</span>);
          }

          return (
            <div key={lineIdx} className="break-words">
              {parts}
            </div>
          );
        })}
      </div>
    );
  };

  // Count total clickable links in current worksheet
  const totalLinksInSheet = useMemo(() => {
    let count = 0;
    if (!currentSheet.gridRows) return 0;
    for (const row of currentSheet.gridRows) {
      for (const cell of row) {
        if (cell.links && cell.links.length > 0) {
          count += cell.links.length;
        }
      }
    }
    return count;
  }, [currentSheet]);

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans transition-all select-none ${
        isFullscreen ? 'fixed inset-4 z-50 max-w-none max-h-none' : 'max-w-6xl h-[82vh]'
      }`}
    >
      {/* 1. TOP EXCEL TITLE / TOOLBAR (Authentic Excel Green: #107c41) */}
      <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between shadow-xs border-b border-[#0d6535]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-white text-[#107c41] flex items-center justify-center font-bold text-xs shadow-xs">
            <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">{file.file_name}</span>
              <span className="bg-[#0b542c] text-emerald-100 text-[10px] px-2 py-0.5 rounded font-medium">
                Microsoft Excel Preview
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 hidden sm:block">
              {currentSheet.name} &bull; {currentSheet.totalRows} rows &bull; {currentSheet.totalCols} columns{totalLinksInSheet > 0 ? ` &bull; ${totalLinksInSheet} link${totalLinksInSheet === 1 ? '' : 's'}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search/Filter within spreadsheet */}
          <div className="relative w-36 sm:w-48">
            <Search className="w-3.5 h-3.5 text-emerald-200 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-[#0b542c] text-white placeholder-emerald-200 text-xs rounded border border-[#0d6535] focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-[#0b542c] rounded border border-[#0d6535] px-1 py-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
              title="Zoom out"
              className="p-1 text-emerald-100 hover:text-white rounded hover:bg-[#107c41]"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-mono px-1 text-white font-medium">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(140, prev + 10))}
              title="Zoom in"
              className="p-1 text-emerald-100 hover:text-white rounded hover:bg-[#107c41]"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 text-emerald-100 hover:text-white rounded bg-[#0b542c] hover:bg-[#094223] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Download button */}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#107c41] hover:bg-emerald-50 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. EXCEL FORMULA BAR (Exact replica of user's uploaded Excel screenshot!) */}
      <div className="bg-[#f8fafc] border-b border-slate-300 px-3 py-1.5 flex items-center gap-2 text-xs">
        {/* Name Box (e.g. F12 with dropdown triangle) */}
        <div className="flex items-center justify-between w-20 px-2 py-1 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-slate-800">
          <span>{activeCellAddress}</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </div>

        {/* Divider & Formula Icons */}
        <div className="h-4 w-px bg-slate-300 mx-0.5" />
        <div className="flex items-center gap-1 text-slate-400 select-none">
          <span className="px-1 text-slate-400 hover:text-slate-600 cursor-pointer font-bold" title="Cancel">
            ✕
          </span>
          <span className="px-1 text-emerald-600 hover:text-emerald-700 cursor-pointer font-bold" title="Enter">
            ✓
          </span>
          <span className="px-1.5 font-serif italic text-slate-600 font-bold text-sm select-none" title="Formula">
            fx
          </span>
        </div>

        {/* Formula Input Box */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            readOnly
            value={activeCell?.formula || activeCell?.value || ''}
            className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-sans shadow-2xs focus:outline-none focus:border-emerald-600"
          />

          {/* If the active cell has hyper links, show instant Open Link button */}
          {activeCell?.links && activeCell.links.length > 0 && (
            <div className="absolute right-1 flex items-center gap-1">
              {activeCell.links.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleOpenLink(url, e)}
                  className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                  title={`Open Video Link: ${url}`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Open Video {activeCell.links.length > 1 ? `#${idx + 1}` : ''}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy active cell text */}
        <button
          type="button"
          onClick={() => activeCell && handleCopyValue(activeCell.value)}
          title="Copy cell text"
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3. EXCEL SPREADSHEET GRID (Crisp White Canvas with Authentic Column Headers & Row Numbers) */}
      <div className="flex-1 overflow-auto bg-slate-100 p-2 relative">
        <div
          className="bg-white inline-block min-w-full border border-slate-300 shadow-xs"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <table className="border-collapse table-auto min-w-full text-xs select-text">
            {/* COLUMN HEADERS ROW: Select-all box + A, B, C, D, E, F, G, H... */}
            <thead>
              <tr className="bg-[#f1f5f9] text-slate-700 border-b border-slate-300">
                {/* Select All Corner box */}
                <th className="w-12 h-6 border-r border-slate-300 bg-[#e2e8f0] text-slate-400 font-normal text-center p-0 select-none sticky left-0 z-20">
                  <div className="w-0 h-0 border-t-8 border-t-slate-400 border-l-8 border-l-transparent ml-auto mb-0.5 mr-0.5" />
                </th>

                {/* Column letters A, B, C, D, E, F, G... */}
                {currentSheet.columns?.map((colLetter, cIdx) => {
                  const isColActive = activeColLetter === colLetter;
                  const colWidth = currentSheet.colWidths?.[cIdx] || 100;
                  return (
                    <th
                      key={colLetter}
                      style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                      className={`h-6 border-r border-slate-300 px-2 py-0.5 text-center font-normal text-[11px] select-none transition-colors ${
                        isColActive ? 'bg-emerald-100 text-emerald-900 font-bold border-b-2 border-b-[#107c41]' : 'bg-[#f1f5f9]'
                      }`}
                    >
                      {colLetter}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* SPREADSHEET ROWS */}
            <tbody>
              {currentSheet.gridRows?.map((rowCells, rIdx) => {
                const rowNumber = rIdx + 1;
                const isRowActive = activeRowNum === rowNumber;

                return (
                  <tr key={rIdx} className="hover:bg-slate-50/40 transition-colors">
                    {/* ROW NUMBER CELL (Leftmost column) */}
                    <td
                      className={`w-12 border-r border-b border-slate-300 text-center select-none font-normal text-[11px] px-1 py-1.5 transition-colors sticky left-0 z-10 ${
                        isRowActive
                          ? 'bg-emerald-100 text-emerald-900 font-bold border-r-2 border-r-[#107c41]'
                          : 'bg-[#f1f5f9] text-slate-600'
                      }`}
                    >
                      {rowNumber}
                    </td>

                    {/* DATA CELLS */}
                    {rowCells.map((cell, cIdx) => {
                      if (cell.isMergedHidden) return null;

                      const isSelected = activeCellAddress === cell.address;
                      const hasLinks = cell.links && cell.links.length > 0;
                      const isMatchingSearch =
                        searchQuery.trim() !== '' &&
                        cell.value.toLowerCase().includes(searchQuery.toLowerCase());

                      return (
                        <td
                          key={cIdx}
                          rowSpan={cell.rowSpan || 1}
                          colSpan={cell.colSpan || 1}
                          onClick={() => setActiveCellAddress(cell.address)}
                          style={{
                            backgroundColor: isMatchingSearch
                              ? '#fef08a'
                              : cell.bgColor || '#ffffff',
                            color: cell.textColor || '#1e293b',
                            fontWeight: cell.isBold ? 700 : 400,
                            textAlign: cell.align || 'left',
                            verticalAlign: cell.valign || 'middle',
                          }}
                          className={`relative border-r border-b border-slate-300 p-2 align-middle text-xs leading-relaxed transition-all cursor-cell whitespace-pre-wrap break-words max-w-2xl ${
                            isSelected
                              ? 'outline-2 outline-[#107c41] outline-offset-[-2px] z-10'
                              : ''
                          }`}
                        >
                          {/* Cell Content */}
                          {renderCellContent(cell)}

                          {/* Authentic Microsoft Excel Corner Fill Square for Selected Cell */}
                          {isSelected && (
                            <div className="absolute right-[-3px] bottom-[-3px] w-2 h-2 bg-[#107c41] border border-white z-20" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BOTTOM SHEET TABS BAR (Exact Excel layout: Nav, Sheet Tabs, Add, Status) */}
      <div className="bg-[#f1f5f9] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Sheet Tab Navigation arrows */}
          <div className="flex items-center text-slate-500">
            <button
              type="button"
              className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded"
              title="Previous Sheet"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded"
              title="Next Sheet"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Worksheet Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {parsedSpreadsheet && parsedSpreadsheet.sheetNames.length > 0 ? (
              parsedSpreadsheet.sheetNames.map((sheetName) => {
                const isActive = (activeSheetName || parsedSpreadsheet.sheetNames[0]) === sheetName;
                return (
                  <button
                    key={sheetName}
                    type="button"
                    onClick={() => onSelectSheet(sheetName)}
                    className={`px-3 py-1 text-xs font-medium rounded-t transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
                      isActive
                        ? 'bg-white text-slate-900 border-slate-300 font-bold border-b-2 border-b-[#107c41] shadow-2xs -mb-1.5'
                        : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{sheetName}</span>
                  </button>
                );
              })
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSelectSheet('July Month')}
                  className={`px-3 py-1 text-xs font-medium rounded-t transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
                    activeSheetName !== 'June Month'
                      ? 'bg-white text-slate-900 border-slate-300 font-bold border-b-2 border-b-[#107c41] shadow-2xs -mb-1.5'
                      : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>July Month</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSheet('June Month')}
                  className={`px-3 py-1 text-xs font-medium rounded-t transition-all flex items-center gap-1.5 cursor-pointer border-t border-x ${
                    activeSheetName === 'June Month'
                      ? 'bg-white text-slate-900 border-slate-300 font-bold border-b-2 border-b-[#107c41] shadow-2xs -mb-1.5'
                      : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>June Month</span>
                </button>
              </>
            )}

            {/* Add Tab (+) */}
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
              title="Add Sheet"
            >
              +
            </button>
          </div>
        </div>

        {/* Right Status Info */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
          <span className="hidden sm:inline">
            Active: <strong className="text-[#107c41]">{activeCellAddress}</strong>
          </span>
          <span className="hidden md:inline">
            Total Rows: <strong className="text-slate-700">{currentSheet.totalRows}</strong>
          </span>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-sans font-medium flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <span>{totalLinksInSheet} Clickable Video Links</span>
          </span>
        </div>
      </div>
    </div>
  );
};
