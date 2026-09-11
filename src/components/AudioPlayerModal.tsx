import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Download,
  Music,
  Clock,
  HardDrive,
  Calendar,
  Smartphone,
  Laptop,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import type { TeachingFile } from '../types.js';
import { formatBytes, formatDate, formatDuration } from '../utils/formatters.js';

interface AudioPlayerModalProps {
  file: TeachingFile | null;
  onClose: () => void;
  onDownload: (file: TeachingFile) => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({ file, onClose, onDownload }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(file?.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    if (file?.duration) {
      setDuration(file.duration);
    }
  }, [file]);

  if (!file) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.volume = volume || 0.5;
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const streamUrl = `/api/files/${file.id}/stream`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white truncate">{file.file_name}</h3>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                Teaching Audio Lecture
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Download Audio"
            >
              <Download className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-1.5 h-20 mb-4 w-full px-8">
            {[40, 65, 30, 85, 45, 95, 70, 50, 80, 60, 45, 90, 75, 55, 35, 80, 65, 40, 95, 60, 75, 45, 85, 30].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-gradient-to-t from-amber-500 to-indigo-500 animate-pulse' : 'bg-slate-700'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(15, (h * (0.6 + Math.sin(i + currentTime) * 0.4)))}%` : '20%',
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>

          <audio
            ref={audioRef}
            src={streamUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Time and Seek Bar */}
          <div className="w-full space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-between w-full mt-4">
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

            {/* Volume */}
            <div className="flex items-center gap-2">
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
                className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Speed */}
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

        {/* Metadata Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Duration</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> {formatDuration(duration)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Size</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" /> {formatBytes(file.file_size)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Uploaded</span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> {formatDate(file.uploaded_at)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Device</span>
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
