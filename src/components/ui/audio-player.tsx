"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, AlertCircle, Music } from "lucide-react";

export function AudioPlayer({
  src,
  title,
  compact = false,
  className = ""
}: {
  src: string;
  title?: string;
  compact?: boolean;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Normalize source URL: if local asset path without leading slash, add leading slash
  const cleanSrc = !src
    ? ""
    : src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")
    ? src
    : `/${src}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [cleanSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || hasError || !cleanSrc) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = parseFloat(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 rounded-xl bg-slate-100/90 hover:bg-slate-100 px-2.5 py-1.5 border border-line transition shadow-2xs ${className}`}>
        {cleanSrc && <audio ref={audioRef} src={cleanSrc} preload="metadata" />}
        <button
          type="button"
          onClick={togglePlay}
          disabled={hasError || !cleanSrc}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition ${
            isPlaying
              ? "bg-brand text-white shadow-xs"
              : hasError
              ? "bg-rose-100 text-rose-500 cursor-not-allowed"
              : "bg-white text-navy hover:bg-blue-50 shadow-2xs border border-line"
          }`}
          title={hasError ? "Audio unavailable" : isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 ml-0.5 fill-current" />
          )}
        </button>

        <div className="flex flex-col justify-center min-w-[65px] flex-1">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
          <div className="relative w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full transition-all duration-100 ${
                isPlaying ? "bg-brand" : "bg-slate-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Animated mini wave bars when playing */}
        {isPlaying ? (
          <div className="flex items-center gap-0.5 h-3.5 shrink-0 px-0.5">
            <span className="w-0.5 h-full bg-brand animate-pulse rounded-full" />
            <span className="w-0.5 h-2 bg-brand animate-pulse delay-75 rounded-full" />
            <span className="w-0.5 h-3.5 bg-brand animate-pulse delay-150 rounded-full" />
            <span className="w-0.5 h-1.5 bg-brand animate-pulse delay-100 rounded-full" />
          </div>
        ) : null}

        {/* Mute button */}
        <button
          type="button"
          onClick={toggleMute}
          disabled={hasError || !cleanSrc}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 hover:text-navy hover:bg-white transition"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-r from-slate-900 via-navy to-slate-900 text-white p-4 shadow-lg border border-white/10 ${className}`}>
      {cleanSrc && <audio ref={audioRef} src={cleanSrc} preload="metadata" />}

      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-cyan-500/20 text-cyan-300 shrink-0">
            <Music className="h-3 w-3" />
          </span>
          <p className="text-xs font-bold text-slate-200 truncate">
            {title || "Educational Audio Clip"}
          </p>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider shrink-0 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50">
          Audio Playback
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Play / Pause Circular Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={hasError || !cleanSrc}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition shadow-md ${
            isPlaying
              ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 scale-105"
              : hasError
              ? "bg-rose-900/60 text-rose-300 cursor-not-allowed"
              : "bg-white text-navy hover:bg-slate-100"
          }`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 ml-0.5 fill-current" />
          )}
        </button>

        {/* Progress Timeline & Scrubber */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300 mb-1">
            <span>{formatTime(currentTime)}</span>
            {/* Visual Waveform Effect when playing */}
            {isPlaying && (
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-2.5 bg-cyan-400 animate-pulse rounded-full" />
                <span className="w-0.5 h-4 bg-cyan-300 animate-pulse delay-75 rounded-full" />
                <span className="w-0.5 h-2 bg-cyan-400 animate-pulse delay-150 rounded-full" />
                <span className="w-0.5 h-3 bg-cyan-300 animate-pulse delay-100 rounded-full" />
                <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse delay-200 rounded-full" />
              </div>
            )}
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={hasError || duration === 0}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-cyan-400 hover:bg-white/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Mute Button */}
        <button
          type="button"
          onClick={toggleMute}
          disabled={hasError || !cleanSrc}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {hasError && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-500/30">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Audio file is loading or unavailable from storage.</span>
        </div>
      )}
    </div>
  );
}
