import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  X,
  Download,
  Smartphone,
  Laptop,
  Calendar,
  HardDrive,
  Clock,
} from 'lucide-react';
import type { TeachingFile } from '../types.js';
import { formatBytes, formatDate, formatDuration } from '../utils/formatters.js';

interface VideoPlayerModalProps {
  file: TeachingFile | null;
  onClose: () => void;
  onDownload: (file: TeachingFile) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ file, onClose, onDownload }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file?.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (file?.duration) {
      setDuration(file.duration);
    }
  }, [file]);

  if (!file) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 0.5;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const streamUrl = `/api/files/${file.id}/stream`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        ref={containerRef}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase">
                Video Lesson
              </span>
              <span className="truncate">{file.file_name}</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
              title="Download Video"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas & Media Container */}
        <div className="relative bg-black flex items-center justify-center flex-1 min-h-[260px] sm:min-h-[380px] overflow-hidden group">
          <video
            ref={videoRef}
            src={streamUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            className="w-full h-full max-h-[60vh] object-contain cursor-pointer"
          />

          {/* Central Play Overlay Button when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 cursor-pointer"
            >
              <Play className="w-8 h-8 ml-1" />
            </button>
          )}
        </div>

        {/* Video Player Controls */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 space-y-2">
          {/* Progress / Seek bar */}
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
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls row */}
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
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => skipSeconds(10)}
                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume control */}
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 text-slate-300 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
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

            {/* Right side: Speed and Fullscreen */}
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

        {/* Video Metadata details requested in Section 7:
            Show thumbnail, filename, duration, size, upload date and device */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Duration</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> {formatDuration(duration)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">File Size</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> {formatBytes(file.file_size)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Upload Date</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {formatDate(file.uploaded_at)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Device Origin</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              {file.device.toLowerCase().includes('mobile') ? (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
              )}
              {file.device}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
