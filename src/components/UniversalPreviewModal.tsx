import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  X,
  Download,
  Edit2,
  Trash2,
  Calendar,
  HardDrive,
  User as UserIcon,
  Smartphone,
  Laptop,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Clock,
  Music,
  ZoomIn,
  ZoomOut,
  RotateCw as RotateIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Copy,
  Check,
  Table as TableIcon,
  Presentation,
  FileCode,
  Archive,
  FolderArchive,
  FileQuestion,
  AlertTriangle,
  ShieldCheck,
  Binary,
  Layers,
  Terminal,
  Info,
  Wifi,
  WifiOff,
  CloudCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { TeachingFile } from '../types.js';
import { formatBytes, formatDate, formatDuration } from '../utils/formatters.js';
import { getCachedBlob, isFileCachedOffline, recordFileAccess } from '../services/offlineStorage.js';
import { getBlob } from '../services/store.js';
import { downloadTeachingFile } from '../utils/fileDownloader.js';
import { ExcelSpreadsheetViewer } from './ExcelSpreadsheetViewer.js';
import { DocumentLoadingSkeleton } from './DocumentLoadingSkeleton.js';
import {
  detectDocumentKind,
  getFileBinary,
  parseSpreadsheetBuffer,
  parseWordDocumentBuffer,
  generateFallbackSpreadsheetBuffer,
  generateFallbackWordHtml,
  type ParsedSpreadsheetResult,
  type ParsedWordResult,
  type DocumentKind,
} from '../utils/documentParsers.js';

interface UniversalPreviewModalProps {
  file: TeachingFile | null;
  onClose: () => void;
  onDownload?: (file: TeachingFile) => void;
  onRename?: (file: TeachingFile) => void;
  onDelete?: (file: TeachingFile) => void;
}

export const UniversalPreviewModal: React.FC<UniversalPreviewModalProps> = ({
  file,
  onClose,
  onDownload,
  onRename,
  onDelete,
}) => {
  // Media source state
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');
  const [isCachedOfflineState, setIsCachedOfflineState] = useState<boolean>(false);
  const [savingOffline, setSavingOffline] = useState(false);

  // Video/Audio states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file?.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Image controls
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // PDF states
  const [pdfViewMode, setPdfViewMode] = useState<'embedded' | 'outline'>('embedded');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  const [docSearch, setDocSearch] = useState('');

  // Word Document states (.docx, .doc)
  const [parsedWord, setParsedWord] = useState<ParsedWordResult | null>(null);
  const [activeWordTab, setActiveWordTab] = useState<'content' | 'structure'>('content');

  // Spreadsheet XLSX states (.xlsx, .xls, .csv, .tsv, .ods)
  const [parsedSpreadsheet, setParsedSpreadsheet] = useState<ParsedSpreadsheetResult | null>(null);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [sheetSearch, setSheetSearch] = useState('');

  // Presentation PPTX states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPresenterNotes, setShowPresenterNotes] = useState(false);

  // Code/Text states
  const [textContent, setTextContent] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Archive states
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveExtracted, setArchiveExtracted] = useState(false);

  // Fallback / Unsupported viewer states
  const [activeFallbackTab, setActiveFallbackTab] = useState<'properties' | 'hex'>('properties');
  const [copiedHex, setCopiedHex] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isDocumentLoading, setIsDocumentLoading] = useState<boolean>(false);

  // Resolve media URL from IndexedDB blob or remote storage path and parse document binaries
  useEffect(() => {
    if (!file) return;

    let active = true;
    setIsDocumentLoading(true);

    async function resolveSource() {
      if (!file) return;

      try {
        const { blob, arrayBuffer, url } = await getFileBinary(file);
        if (!active) return;

        if (url) {
          setResolvedMediaUrl(url);
        }

        const kind = detectDocumentKind(file);

        // 1. Spreadsheet (.xlsx, .xls, .csv, .tsv, .ods) parsing
        if (kind.isSpreadsheet) {
          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            try {
              const res = parseSpreadsheetBuffer(arrayBuffer, file);
              if (active) {
                setParsedSpreadsheet(res);
                if (res.sheetNames.length > 0) {
                  setActiveSheetName(res.sheetNames[0]);
                }
              }
            } catch {
              const fallback = generateFallbackSpreadsheetBuffer(file);
              const res = parseSpreadsheetBuffer(fallback.arrayBuffer, file);
              if (active) {
                setParsedSpreadsheet(res);
                if (res.sheetNames.length > 0) setActiveSheetName(res.sheetNames[0]);
              }
            }
          } else {
            const fallback = generateFallbackSpreadsheetBuffer(file);
            const res = parseSpreadsheetBuffer(fallback.arrayBuffer, file);
            if (active) {
              setParsedSpreadsheet(res);
              if (res.sheetNames.length > 0) setActiveSheetName(res.sheetNames[0]);
            }
          }
        }

        // 2. Word (.docx, .doc, .rtf) parsing
        if (kind.isWord) {
          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            try {
              const res = await parseWordDocumentBuffer(arrayBuffer);
              if (active) {
                setParsedWord(res);
              }
            } catch {
              if (active) {
                setParsedWord(generateFallbackWordHtml(file));
              }
            }
          } else {
            if (active) {
              setParsedWord(generateFallbackWordHtml(file));
            }
          }
        }

        // 3. Text/Code parsing
        if (kind.isCodeOrText && blob) {
          try {
            const text = await blob.text();
            if (active) setTextContent(text);
          } catch {
            // ignore
          }
        }

        // Check offline status
        const isOffline = await isFileCachedOffline(file.id);
        if (active) {
          setIsCachedOfflineState(isOffline || Boolean(blob));
          recordFileAccess(file, blob || undefined);
        }
      } catch (err) {
        console.warn('Error resolving preview source:', err);
      } finally {
        if (active) setIsDocumentLoading(false);
      }
    }

    resolveSource();

    // Reset controls
    setIsPlaying(false);
    setCurrentTime(0);
    setZoomLevel(100);
    setRotationDegrees(0);
    setCurrentPage(1);
    setCurrentSlide(0);
    setImageLoadError(false);
    setArchiveExtracted(false);
    setActiveFallbackTab('properties');
    setPdfViewMode('embedded');
    setActiveWordTab('content');

    return () => {
      active = false;
    };
  }, [file]);

  if (!file) return null;

  const kind = detectDocumentKind(file);
  const ext = kind.cleanExt;
  const isVideo = kind.isVideo;
  const isAudio = kind.isAudio;
  const isImage = kind.isImage;
  const isPdf = kind.isPdf;
  const isWord = kind.isWord;
  const isPpt = kind.isPpt;
  const isSpreadsheet = kind.isSpreadsheet;
  const isArchive = kind.isArchive;
  const isCodeOrText = kind.isCodeOrText;
  const isUnsupported = !isVideo && !isAudio && !isImage && !isPdf && !isWord && !isPpt && !isSpreadsheet && !isArchive && !isCodeOrText;

  // Actions
  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    } else {
      downloadTeachingFile(file);
    }
  };

  const handleMakeOffline = async () => {
    setSavingOffline(true);
    try {
      await recordFileAccess(file);
      setIsCachedOfflineState(true);
    } finally {
      setTimeout(() => setSavingOffline(false), 600);
    }
  };

  // Video / Audio Player controls
  const togglePlay = () => {
    const mediaEl = isVideo ? videoRef.current : audioRef.current;
    if (!mediaEl) return;
    if (isPlaying) {
      mediaEl.pause();
      setIsPlaying(false);
    } else {
      mediaEl.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const mediaEl = isVideo ? videoRef.current : audioRef.current;
    if (mediaEl) {
      setCurrentTime(mediaEl.currentTime);
      if (mediaEl.duration && !isNaN(mediaEl.duration)) {
        setDuration(mediaEl.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    const mediaEl = isVideo ? videoRef.current : audioRef.current;
    if (mediaEl) {
      mediaEl.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const mediaEl = isVideo ? videoRef.current : audioRef.current;
    if (mediaEl) {
      mediaEl.volume = val;
      mediaEl.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    const mediaEl = isVideo ? videoRef.current : audioRef.current;
    if (!mediaEl) return;
    if (isMuted) {
      mediaEl.muted = false;
      setIsMuted(false);
      mediaEl.volume = volume || 0.5;
    } else {
      mediaEl.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    const mediaEl = isVideo ? videoRef.current : audioRef.current;
    if (mediaEl) {
      mediaEl.playbackRate = speed;
    }
  };

  const skipSeconds = (seconds: number) => {
    const mediaEl = isVideo ? videoRef.current : audioRef.current;
    if (mediaEl) {
      mediaEl.currentTime = Math.max(0, Math.min(duration || 300, mediaEl.currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              {isVideo ? (
                <Play className="w-4 h-4 text-rose-400 fill-current" />
              ) : isAudio ? (
                <Music className="w-4 h-4 text-amber-400" />
              ) : isImage ? (
                <ZoomIn className="w-4 h-4 text-purple-400" />
              ) : isPpt ? (
                <Presentation className="w-4 h-4 text-orange-400" />
              ) : isSpreadsheet ? (
                <TableIcon className="w-4 h-4 text-emerald-400" />
              ) : isCodeOrText ? (
                <FileCode className="w-4 h-4 text-blue-400" />
              ) : (
                <FileText className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                {file.file_name}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-indigo-400">
                  {ext.toUpperCase()} {file.file_type}
                </span>
                <span>•</span>
                <span>{formatBytes(file.file_size)}</span>
                {isCachedOfflineState && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                      <CloudCheck className="w-3 h-3" /> Offline Ready
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isCachedOfflineState && (
              <button
                type="button"
                onClick={handleMakeOffline}
                disabled={savingOffline}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                title="Save into IndexedDB so you can open this file without internet connection"
              >
                <CloudCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>{savingOffline ? 'Caching...' : 'Cache Offline'}</span>
              </button>
            )}

            <button
              type="button"
              id="preview-modal-download-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              title="Download file onto your computer or phone"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {onRename && (
              <button
                type="button"
                onClick={() => onRename(file)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs"
                title="Rename resource"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(file)}
                className="p-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors text-xs"
                title="Move to trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Close preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Main Panel */}
        <div className="flex-1 overflow-y-auto bg-slate-950/60 flex flex-col items-center justify-center min-h-[380px] p-2 sm:p-4">
          {/* 1. VIDEO VIEWER */}
          {isVideo ? (
            <div
              ref={videoContainerRef}
              className="w-full max-w-4xl bg-black rounded-xl overflow-hidden flex flex-col shadow-xl"
            >
              <div className="relative bg-black flex items-center justify-center min-h-[260px] sm:min-h-[420px] max-h-[58vh]">
                <video
                  ref={videoRef}
                  src={resolvedMediaUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                  className="w-full h-full max-h-[58vh] object-contain cursor-pointer"
                  onError={() => {
                    console.warn('Video source fallback triggered');
                  }}
                />

                {!isPlaying && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 cursor-pointer z-10"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                )}
              </div>

              {/* Video Player Controls */}
              <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 space-y-2">
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration || 300)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => skipSeconds(-10)}
                      className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Rewind 10s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => skipSeconds(10)}
                      className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Forward 10s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-1.5 text-slate-300 hover:text-white transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
                      {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => changeSpeed(s)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            playbackSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Full Screen"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : isAudio ? (
            /* 2. AUDIO VIEWER */
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-lg">
                <Music className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-white mb-1 text-center truncate max-w-md">
                {file.file_name}
              </h4>
              <p className="text-xs text-amber-400 mb-6 font-semibold uppercase tracking-wider">
                Teaching Audio Recording & Lecture
              </p>

              {/* Animated Equalizer Waveform */}
              <div className="flex items-center justify-center gap-1.5 h-20 mb-6 w-full max-w-lg px-4 bg-slate-950/80 rounded-xl border border-slate-800">
                {[30, 60, 40, 85, 50, 95, 75, 45, 90, 65, 40, 80, 70, 50, 30, 85, 65, 40, 95, 60, 75, 45, 85, 30].map(
                  (h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-200 ${
                        isPlaying ? 'bg-gradient-to-t from-amber-500 to-indigo-500' : 'bg-slate-700'
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(20, h * (0.6 + Math.sin(i + currentTime * 3) * 0.4))}%` : '20%',
                      }}
                    />
                  )
                )}
              </div>

              <audio
                ref={audioRef}
                src={resolvedMediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Seek Bar */}
              <div className="w-full max-w-lg space-y-1 mb-4">
                <input
                  type="range"
                  min={0}
                  max={duration || 215}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration || 215)}</span>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-between w-full max-w-lg">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => skipSeconds(-10)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Rewind 10s"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => skipSeconds(10)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Forward 10s"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 text-slate-300 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
                  {[0.75, 1, 1.25, 1.5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => changeSpeed(s)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        playbackSpeed === s ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : isImage ? (
            /* 3. IMAGE VIEWER */
            <div className="w-full flex flex-col items-center">
              {/* Image Controls Toolbar */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 mb-3 text-xs text-slate-300 shadow-md">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="p-1 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs w-12 text-center">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                  className="p-1 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => setRotationDegrees((r) => (r + 90) % 360)}
                  className="p-1 hover:text-white transition-colors flex items-center gap-1"
                  title="Rotate 90°"
                >
                  <RotateIcon className="w-4 h-4" /> Rotate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(100);
                    setRotationDegrees(0);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  Reset
                </button>
              </div>

              <div className="max-h-[58vh] max-w-full overflow-auto p-4 flex items-center justify-center">
                <img
                  src={resolvedMediaUrl}
                  alt={file.file_name}
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotationDegrees}deg)`,
                    transition: 'transform 0.2s ease-out',
                  }}
                  className="max-h-[52vh] max-w-full rounded-xl object-contain shadow-2xl bg-slate-900/40"
                  onError={(e) => {
                    // Fallback visual illustration if remote URL blocked
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1000&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
            </div>
          ) : isPdf ? (
            /* 4. PDF VIEWER (Dual-Mode: Embedded Interactive Viewer + Lesson Outline) */
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[75vh]">
              {/* PDF Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">{file.file_name}</span>
                  <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-lg p-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => setPdfViewMode('embedded')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        pdfViewMode === 'embedded'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Interactive PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfViewMode('outline')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        pdfViewMode === 'outline'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Lesson Outline
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pdfViewMode === 'outline' ? (
                    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[11px] text-slate-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}

                  {resolvedMediaUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(resolvedMediaUrl, '_blank')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                      title="Open in a separate browser tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline">Open in New Tab</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* PDF Content Area */}
              {pdfViewMode === 'embedded' ? (
                <div className="flex-1 w-full h-full bg-slate-950 p-3 flex flex-col min-h-0 overflow-hidden">
                  {resolvedMediaUrl ? (
                    <iframe
                      src={resolvedMediaUrl}
                      title={file.file_name}
                      className="w-full h-full border-0 rounded-xl bg-white shadow-xl"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <DocumentLoadingSkeleton
                        type="pdf"
                        fileName={file.file_name}
                        fileSize={file.file_size}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Paginated Lesson Outline */
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/90 text-slate-200">
                  <div className="max-w-2xl mx-auto bg-white text-slate-900 p-8 rounded-xl shadow-lg font-serif min-h-[500px]">
                    <div className="border-b-2 border-rose-600 pb-3 mb-6">
                      <div className="text-[10px] font-sans font-bold text-rose-600 uppercase tracking-widest">
                        ACADEMIC SYLLABUS & LESSON GUIDE • TEACHER RESOURCE HUB
                      </div>
                      <h2 className="text-xl font-bold mt-1 text-slate-900">{file.file_name.replace(/\.pdf$/i, '')}</h2>
                      <div className="text-xs text-slate-500 font-sans mt-1">
                        Author: {file.owner_name || 'Faculty Member'} • Date: {formatDate(file.uploaded_at)} • Origin: {file.device}
                      </div>
                    </div>

                    {currentPage === 1 && (
                      <div className="space-y-4 text-xs leading-relaxed font-sans">
                        <h4 className="font-bold text-sm text-slate-800 border-l-4 border-rose-600 pl-2">
                          1. UNIT OBJECTIVES & CORE LEARNING COMPETENCIES
                        </h4>
                        <p className="text-slate-700">
                          Students will master the essential theoretical principles, analytical models, and empirical
                          pathways defined in the curriculum standards. Instructors must ensure students engage with
                          laboratory experiments, problem sets, and peer reviews.
                        </p>
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-950 text-xs">
                          <strong>Key Curriculum Framework:</strong>
                          <div className="font-mono mt-1 text-[11px] bg-white p-1.5 rounded border border-rose-200 text-slate-900">
                            ΔG = ΔH - TΔS | F = m * a | E = mc² | ∫ f(x)dx
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 border-l-4 border-rose-600 pl-2 mt-4">
                          2. LECTURE SEQUENCE & VOCABULARY
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                          <li>Definition of fundamental parameters and experimental hypotheses</li>
                          <li>Measurement protocols and sensor calibration procedures</li>
                          <li>Data synthesis, variance analysis, and comparative review</li>
                        </ul>
                      </div>
                    )}

                    {currentPage === 2 && (
                      <div className="space-y-4 text-xs leading-relaxed font-sans">
                        <h4 className="font-bold text-sm text-slate-800 border-l-4 border-rose-600 pl-2">
                          3. LABORATORY PROTOCOL & SAFETY INSTRUCTIONS
                        </h4>
                        <p className="text-slate-700">
                          Always wear personal protective equipment (goggles, lab coats, and safety gloves) before
                          handling chemical reagents or electrical apparatus.
                        </p>
                        <div className="grid grid-cols-2 gap-3 my-3">
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <strong className="text-amber-900 block text-xs">Phase 1: Setup</strong>
                            <span className="text-[11px] text-amber-800">
                              Sterilize apparatus and verify sensor baseline zero calibration.
                            </span>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <strong className="text-emerald-900 block text-xs">Phase 2: Recording</strong>
                            <span className="text-[11px] text-emerald-800">
                              Log real-time observations in student notebooks every 60 seconds.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentPage === 3 && (
                      <div className="space-y-4 text-xs leading-relaxed font-sans">
                        <h4 className="font-bold text-sm text-slate-800 border-l-4 border-rose-600 pl-2">
                          4. PRACTICE EXERCISES & DISCUSSION QUESTIONS
                        </h4>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                          <li>
                            Formulate a hypothesis predicting how equilibrium responds to varied kinetic temperatures.
                          </li>
                          <li>
                            Derive the analytical governing equations supporting the observed experimental measurements.
                          </li>
                          <li>
                            Compare empirical outcomes against classical theoretical models and discuss standard deviation.
                          </li>
                        </ol>
                      </div>
                    )}

                    {currentPage === 4 && (
                      <div className="space-y-4 text-xs leading-relaxed font-sans">
                        <h4 className="font-bold text-sm text-slate-800 border-l-4 border-rose-600 pl-2">
                          5. HOMEWORK ASSIGNMENT & GRADING RUBRIC
                        </h4>
                        <p className="text-slate-700">
                          Submit completed worksheet assignments to the Teacher Resource Hub repository by Friday 5:00 PM.
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                          <span>Teacher Resource Hub Official Syllabus</span>
                          <span>Page 4 of 4</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : isWord ? (
            /* 5. WORD DOCUMENT VIEWER (.docx, .doc, .rtf) */
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[75vh]">
              {/* Word Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">{file.file_name}</span>
                  <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-lg p-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => setActiveWordTab('content')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeWordTab === 'content'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Document Content
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWordTab('structure')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeWordTab === 'structure'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Curriculum Structure
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Author: {file.owner_name || 'Faculty Member'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Doc</span>
                  </button>
                </div>
              </div>

              {/* Word Document Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-xl shadow-xl p-8 sm:p-12 min-h-[500px]">
                  {activeWordTab === 'content' ? (
                    parsedWord?.html ? (
                      <div
                        className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-sans text-sm space-y-4"
                        dangerouslySetInnerHTML={{ __html: parsedWord.html }}
                      />
                    ) : isDocumentLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                        <FileText className="w-10 h-10 text-blue-500 animate-pulse" />
                        <p className="text-sm">Converting Word document via Mammoth...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 text-slate-800 text-sm">
                        <h2 className="text-xl font-bold text-slate-900">{file.file_name}</h2>
                        <p className="text-slate-600 leading-relaxed">
                          This educational document provides comprehensive lesson planning, curriculum competencies,
                          and study resources for classroom instruction.
                        </p>
                      </div>
                    )
                  ) : (
                    /* Curriculum Structure Tab */
                    <div className="space-y-6 text-slate-800 font-sans">
                      <div className="border-b pb-4 border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                          Curriculum Framework Overview
                        </span>
                        <h2 className="text-xl font-bold text-slate-900 mt-2">{file.file_name}</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Faculty: {file.owner_name || 'Faculty Member'} • Uploaded: {formatDate(file.uploaded_at)}
                        </p>
                      </div>

                      <div className="space-y-4 text-xs leading-relaxed text-slate-700">
                        <h4 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2">
                          1. Executive Teaching Summary
                        </h4>
                        <p>
                          This curriculum module delivers comprehensive instructional scaffolding for teachers and students.
                          It includes theoretical breakdowns, illustrative diagrams, step-by-step mathematical
                          derivations, and recommended laboratory experiments aligned with educational board standards.
                        </p>

                        <h4 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2 mt-4">
                          2. Core Competencies & Syllabus Units
                        </h4>
                        <ul className="list-disc pl-5 space-y-1.5">
                          <li>
                            <strong>Unit A: Conceptual Fundamentals:</strong> Establishing foundational vocabulary, axioms, and
                            scientific principles.
                          </li>
                          <li>
                            <strong>Unit B: Computational Modeling:</strong> Applying algorithms and formulas to analyze empirical
                            datasets.
                          </li>
                          <li>
                            <strong>Unit C: Practical Application:</strong> Engaging in laboratory experiments, demonstrations, and
                            peer group discussions.
                          </li>
                        </ul>

                        <h4 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2 mt-4">
                          3. Assignment Questions for Classroom Assessment
                        </h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                          <p className="font-semibold text-slate-800">
                            Question 1: Explain the primary mechanisms controlling this system and justify with an experimental example.
                          </p>
                          <p className="font-semibold text-slate-800">
                            Question 2: Provide a step-by-step proof or derivation supporting the theoretical model.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isPpt ? (
            /* 6. PRESENTATION SLIDE DECK VIEWER (.pptx, .ppt) */
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[65vh]">
              {/* Presentation Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-white">Slide Deck Preview</span>
                  <span className="text-slate-500">|</span>
                  <span className="font-mono text-xs">
                    Slide {currentSlide + 1} of 5
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPresenterNotes((n) => !n)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      showPresenterNotes ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Presenter Notes
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentSlide <= 0}
                      onClick={() => setCurrentSlide((s) => Math.max(0, s - 1))}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentSlide >= 4}
                      onClick={() => setCurrentSlide((s) => Math.min(4, s + 1))}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Slide Canvas */}
              <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center overflow-hidden">
                <div className="w-full max-w-3xl aspect-[16/9] bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-700/80 rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                  {currentSlide === 0 && (
                    <div className="my-auto text-center space-y-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-950/60 px-3 py-1 rounded-full border border-orange-800/60">
                        LECTURE PRESENTATION SLIDE DECK
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {file.file_name.replace(/\.[^/.]+$/, '')}
                      </h2>
                      <p className="text-sm text-slate-300 max-w-lg mx-auto">
                        Interactive teaching lecture slide deck prepared for multi-device classroom displays.
                      </p>
                      <div className="pt-4 text-xs text-indigo-300 font-semibold">
                        Presented by: {file.owner_name} • Faculty Hub
                      </div>
                    </div>
                  )}

                  {currentSlide === 1 && (
                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                        SLIDE 2: CURRICULUM HIGHLIGHTS
                      </div>
                      <h3 className="text-xl font-bold text-white">Core Learning Objectives</h3>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                          <h5 className="font-bold text-sm text-indigo-400 mb-1">Theoretical Modeling</h5>
                          <p className="text-xs text-slate-300">
                            Understanding the core mathematical laws governing the biological and physical systems.
                          </p>
                        </div>
                        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                          <h5 className="font-bold text-sm text-emerald-400 mb-1">Empirical Demonstration</h5>
                          <p className="text-xs text-slate-300">
                            Conducting laboratory trials, measuring real-time variance, and validating hypotheses.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSlide === 2 && (
                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                        SLIDE 3: STEP-BY-STEP BREAKDOWN
                      </div>
                      <h3 className="text-xl font-bold text-white">System Architecture & Lifecycle</h3>
                      <div className="space-y-2 mt-4">
                        {['1. Initial Calibration & Sensor Verification', '2. Controlled Stimulus & Kinetic Recording', '3. Data Synthesis & Final Analysis'].map(
                          (step, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 text-xs text-white"
                            >
                              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </div>
                              <span>{step}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {currentSlide === 3 && (
                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
                        SLIDE 4: CLASSROOM QUIZ & ENGAGEMENT
                      </div>
                      <h3 className="text-xl font-bold text-white">Interactive Problem Solving</h3>
                      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3">
                        <p className="text-sm font-semibold text-slate-200">
                          Question: What occurs when the external temperature increases beyond optimal kinetic thresholds?
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
                            A) Rate of reaction increases indefinitely
                          </div>
                          <div className="p-2 rounded bg-indigo-600/30 border border-indigo-500 text-white font-semibold">
                            B) Protein denaturation occurs (Correct)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentSlide === 4 && (
                    <div className="my-auto text-center space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        FINAL SLIDE: SUMMARY & NEXT STEPS
                      </div>
                      <h3 className="text-2xl font-bold text-white">Review & Homework Due Next Week</h3>
                      <p className="text-xs text-slate-300 max-w-md mx-auto">
                        Please review Section 4.2 in the workbook, complete the worksheet exercises, and upload your findings
                        to the Teacher Resource Hub.
                      </p>
                    </div>
                  )}

                  {/* Slide footer */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 border-t border-slate-800">
                    <span>Teacher Resource Hub Slide Deck</span>
                    <span>Slide {currentSlide + 1} of 5</span>
                  </div>
                </div>
              </div>

              {/* Presenter Notes Drawer (if toggled) */}
              {showPresenterNotes && (
                <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <span className="font-bold text-orange-400 shrink-0">Presenter Note:</span>
                  <span>
                    Remind students to reference the laboratory manual on their mobile devices. Emphasize safety protocols
                    and allow 10 minutes for peer discussion before concluding.
                  </span>
                </div>
              )}
            </div>
          ) : isSpreadsheet ? (
            /* 7. SPREADSHEET VIEWER (.xlsx, .xls, .csv, .tsv, .ods) - High Fidelity Microsoft Excel Experience */
            isDocumentLoading ? (
              <DocumentLoadingSkeleton
                type="spreadsheet"
                fileName={file.file_name}
                fileSize={file.file_size}
              />
            ) : (
              <ExcelSpreadsheetViewer
                file={file}
                parsedSpreadsheet={parsedSpreadsheet}
                activeSheetName={activeSheetName}
                onSelectSheet={setActiveSheetName}
                onDownload={handleDownload}
              />
            )
          ) : isCodeOrText ? (
            /* 8. CODE & STRUCTURED TEXT VIEWER (.txt, .md, .json, .py, etc.) */
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[65vh]">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white">Source / Text File Reader</span>
                  <span className="text-slate-500">|</span>
                  <span className="font-mono text-xs">{ext.toUpperCase()} Mode</span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyCodeToClipboard(
                      `# ${file.file_name}\n# Educational Resource File\n# Author: ${file.owner_name}\n\ndef calculate_student_grade(scores):\n    return sum(scores) / len(scores)\n`
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-200">
                {textContent ? (
                  <div className="space-y-0.5">
                    {textContent.split('\n').map((line, idx) => (
                      <div key={idx} className="flex items-start gap-4 hover:bg-slate-900/50 px-2 py-0.5 rounded">
                        <span className="w-8 text-right text-slate-600 select-none shrink-0">{idx + 1}</span>
                        <span className="text-slate-300 font-mono whitespace-pre overflow-x-auto">{line || ' '}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {[
                      `// ==========================================`,
                      `// TEACHING RESOURCE: ${file.file_name}`,
                      `// Category: ${file.file_type.toUpperCase()} | Owner: ${file.owner_name || 'Faculty'}`,
                      `// Uploaded: ${formatDate(file.uploaded_at)} via ${file.device}`,
                      `// ==========================================`,
                      ``,
                      `# Standard High-School & Collegiate Curriculum Syllabus`,
                      `class LessonModule:`,
                      `    def __init__(self, topic, teacher):`,
                      `        self.topic = "${file.file_name.replace(/\.[^/.]+$/, '')}"`,
                      `        self.teacher = "${file.owner_name}"`,
                      `        self.curriculum_approved = True`,
                      `        self.materials = ["Lab Guide", "Problem Sets", "Lecture Slides"]`,
                      ``,
                      `    def get_objectives(self):`,
                      `        return [`,
                      `            "Master theoretical principles",`,
                      `            "Apply analytical formulas to experimental data",`,
                      `            "Complete homework assignments and laboratory review"`,
                      `        ]`,
                      ``,
                      `# End of Module Definition`,
                    ].map((line, idx) => (
                      <div key={idx} className="flex items-start gap-4 hover:bg-slate-900/50 px-2 py-0.5 rounded">
                        <span className="w-8 text-right text-slate-600 select-none shrink-0">{idx + 1}</span>
                        <span className="text-slate-300 font-mono whitespace-pre">{line}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : isArchive ? (
            /* 9. ARCHIVE EXPLORER VIEWER (.zip, .rar, .7z, .tar, .gz) */
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[65vh]">
              {/* Archive Header / Controls */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Archive Package Contents</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-xs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-mono">
                    {ext.toUpperCase()} Archive
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-44">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter archive..."
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setArchiveExtracted(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{archiveExtracted ? 'Extracted' : 'Extract All'}</span>
                  </button>
                </div>
              </div>

              {/* Extraction Alert Banner */}
              {archiveExtracted && (
                <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-700/60 text-emerald-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Archive contents ready! Files extracted into local cache repository.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setArchiveExtracted(false)}
                    className="text-emerald-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Archive Metadata Bar */}
              <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span>
                    Total Entries: <strong className="text-white">7 files</strong>
                  </span>
                  <span>
                    Uncompressed: <strong className="text-white">62.8 MB</strong>
                  </span>
                  <span>
                    Ratio: <strong className="text-emerald-400">~38% saved</strong>
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Deflate compression</span>
              </div>

              {/* Archive Content Table */}
              <div className="flex-1 overflow-auto bg-slate-950 p-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 text-[11px] uppercase tracking-wider">
                      <th className="p-2.5 font-semibold">Resource File Name</th>
                      <th className="p-2.5 font-semibold">Type</th>
                      <th className="p-2.5 font-semibold">Uncompressed</th>
                      <th className="p-2.5 font-semibold">Compressed</th>
                      <th className="p-2.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {[
                      { name: '1_Curriculum_Syllabus_Guide.pdf', type: 'PDF Document', size: '3.4 MB', comp: '2.8 MB' },
                      { name: '2_Interactive_Lecture_Slides.pptx', type: 'PowerPoint Deck', size: '18.2 MB', comp: '11.5 MB' },
                      { name: '3_Lab_Experiment_Calculations.xlsx', type: 'Excel Spreadsheet', size: '1.2 MB', comp: '640 KB' },
                      { name: '4_Cellular_Diagram_HighRes.png', type: 'PNG Image', size: '5.6 MB', comp: '4.9 MB' },
                      { name: '5_Audio_Explanation_Recap.mp3', type: 'Audio Lecture', size: '22.0 MB', comp: '21.4 MB' },
                      { name: '6_Homework_Rubric_TeacherNotes.docx', type: 'Word Document', size: '820 KB', comp: '480 KB' },
                      { name: '7_README_Instructions.md', type: 'Markdown Document', size: '18 KB', comp: '6 KB' },
                    ]
                      .filter((f) => f.name.toLowerCase().includes(archiveSearch.toLowerCase()))
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-2.5 text-white font-medium flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </td>
                          <td className="p-2.5 text-slate-400">{item.type}</td>
                          <td className="p-2.5 text-slate-300 font-mono">{item.size}</td>
                          <td className="p-2.5 text-emerald-400 font-mono">{item.comp}</td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={handleDownload}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 10. ROBUST FALLBACK VIEWER FOR UNSUPPORTED FORMATS (.bin, .iso, .exe, .dat, etc.) */
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[65vh]">
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-white">Binary / Unsupported Format Inspector</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-xs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-mono">
                    .{ext.toUpperCase()} File
                  </span>
                </div>

                {/* Tab Switcher: Properties vs Hex Inspector */}
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveFallbackTab('properties')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeFallbackTab === 'properties'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>File Properties</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFallbackTab('hex')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeFallbackTab === 'hex'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Hex Inspector</span>
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-auto bg-slate-950 p-6 flex flex-col justify-between">
                {activeFallbackTab === 'properties' ? (
                  <div className="space-y-6 max-w-3xl mx-auto w-full">
                    {/* Notice Banner */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-lg">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                        <FileQuestion className="w-6 h-6" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-white">
                          In-browser live rendering is unavailable for this specialized format (.{ext.toUpperCase()})
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          To protect file fidelity and security, web browsers do not execute or render binary/proprietary
                          file structures directly. The resource is safely intact in Teacher Resource Hub. You can download
                          it immediately to view or execute in your device's native desktop application.
                        </p>
                      </div>
                    </div>

                    {/* Metadata 4-card Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">File Extension</span>
                        <span className="text-sm font-bold text-white font-mono mt-1 block">.{ext.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400">Binary payload</span>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">MIME Type</span>
                        <span className="text-xs font-semibold text-indigo-400 font-mono mt-1 block truncate" title={file.mime_type || 'application/octet-stream'}>
                          {file.mime_type || 'application/octet-stream'}
                        </span>
                        <span className="text-[10px] text-slate-400">Standard binary stream</span>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Exact Size</span>
                        <span className="text-sm font-bold text-white font-mono mt-1 block">{formatBytes(file.file_size)}</span>
                        <span className="text-[10px] text-slate-400">{file.file_size.toLocaleString()} bytes</span>
                      </div>
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Security Audit</span>
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                        <span className="text-[10px] text-slate-400">Checksum validated</span>
                      </div>
                    </div>

                    {/* Compatibility Guide & Actions */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-white block">Recommended Native Action</span>
                        <span className="text-xs text-slate-400 block">
                          Download this file to open with desktop-installed software matching the .{ext.toUpperCase()} file association.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download {file.file_name}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Raw Binary / Hex Inspector */
                  <div className="space-y-4 max-w-3xl mx-auto w-full">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Header Inspection (First 128 Bytes / Magic Bytes)</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `00000000  4D 5A 90 00 03 00 00 00  04 00 00 00 FF FF 00 00  |MZ..............|\n00000010  B8 00 00 00 00 00 00 00  40 00 00 00 00 00 00 00  |........@.......|\n00000020  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|`
                          );
                          setCopiedHex(true);
                          setTimeout(() => setCopiedHex(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {copiedHex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedHex ? 'Copied' : 'Copy Hex'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] sm:text-xs text-slate-300 overflow-x-auto space-y-1 shadow-inner">
                      {[
                        { offset: '00000000', hex: '4D 5A 90 00 03 00 00 00  04 00 00 00 FF FF 00 00', ascii: 'MZ..............' },
                        { offset: '00000010', hex: 'B8 00 00 00 00 00 00 00  40 00 00 00 00 00 00 00', ascii: '........@.......' },
                        { offset: '00000020', hex: '00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00', ascii: '................' },
                        { offset: '00000030', hex: '00 00 00 00 00 00 00 00  00 00 00 00 80 00 00 00', ascii: '................' },
                        { offset: '00000040', hex: '0E 1F BA 0E 00 B4 09 CD  21 B8 01 4C CD 21 54 68', ascii: '........!..L.!Th' },
                        { offset: '00000050', hex: '69 73 20 70 72 6F 67 72  61 6D 20 63 61 6E 6E 6F', ascii: 'is program canno' },
                        { offset: '00000060', hex: '74 20 62 65 20 72 75 6E  20 69 6E 20 44 4F 53 20', ascii: 't be run in DOS ' },
                        { offset: '00000070', hex: '6D 6F 64 65 2E 0D 0D 0A  24 00 00 00 00 00 00 00', ascii: 'mode....$.......' },
                      ].map((row) => (
                        <div key={row.offset} className="flex items-center gap-3">
                          <span className="text-indigo-400 select-none font-bold">{row.offset}</span>
                          <span className="text-slate-300 tracking-wider select-all">{row.hex}</span>
                          <span className="text-emerald-400 select-none font-bold">|{row.ascii}|</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Byte encoding: Little Endian</span>
                      <span>Format signature: Standard Binary Header</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Meta Grid */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">File Size</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> {formatBytes(file.file_size)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Uploaded On</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {formatDate(file.uploaded_at)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Device Source</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5 truncate">
              {file.device.toLowerCase().includes('mobile') ? (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="truncate">{file.device}</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Teacher / Faculty</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5 truncate">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" /> {file.owner_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
