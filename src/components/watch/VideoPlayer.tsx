"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Maximize, Minimize, Loader2, Play, Pause,
  SkipBack, SkipForward, Volume2, VolumeX
} from "lucide-react";

interface VideoPlayerProps {
  embedUrl: string;
  directVideo?: boolean;
  onProgress?: (p: { seconds: number; percent: number; duration: number }) => void;
}

export function VideoPlayer({ embedUrl, directVideo = false, onProgress }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastClick = useRef(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIframeLoading(true);
    setIframeError(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
  }, [embedUrl]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    const v = videoRef.current;
    if (!v || !isFinite(v.duration) || v.duration <= 0) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  }, []);

  const seekToPosition = useCallback((clientX: number) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar || !isFinite(v.duration) || v.duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = ratio * v.duration;
    setCurrentTime(newTime);
    v.currentTime = newTime;
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    seekToPosition(e.clientX);
  }, [seekToPosition]);

  const handleProgressPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const bar = progressRef.current;
    if (bar) bar.setPointerCapture(e.pointerId);
    dragging.current = true;
    seekToPosition(e.clientX);
  }, [seekToPosition]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      seekToPosition(e.clientX);
    }
    function onPointerUp() { dragging.current = false; }
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [seekToPosition]);

  const handleVideoAreaClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input")) return;
    const now = Date.now();
    if (now - lastClick.current < 300) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      seek(x < rect.width / 2 ? -10 : 10);
      lastClick.current = 0;
      return;
    }
    lastClick.current = now;
    togglePlay();
  }, [togglePlay, seek]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const v = videoRef.current;
      if (!v) return;
      switch (e.code) {
        case "Space": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); seek(-5); break;
        case "ArrowRight": e.preventDefault(); seek(5); break;
        case "KeyF": e.preventDefault(); toggleFullscreen(); break;
        case "KeyM": e.preventDefault(); if (v) { v.muted = !v.muted; setMuted(v.muted); } break;
        case "ArrowUp": e.preventDefault(); if (v) { v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); } break;
        case "ArrowDown": e.preventDefault(); if (v) { v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); } break;
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, toggleFullscreen]);

  useEffect(() => {
    function onFsChange() { setIsFullscreen(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function updateBuffer() {
      if (v && v.buffered.length > 0) {
        setBuffered((v.buffered.end(v.buffered.length - 1) / (v.duration || 1)) * 100);
      }
    }
    v.addEventListener("progress", updateBuffer);
    return () => v.removeEventListener("progress", updateBuffer);
  }, []);

  if (!embedUrl) return null;

  const isVideo = directVideo || embedUrl.includes("googlevideo.com");
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  function formatTime(s: number) {
    if (!isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (!isVideo) {
    return (
      <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/30 group">
        {iframeLoading && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
            <Loader2 className="h-10 w-10 text-accent animate-spin" />
            <p className="text-sm text-white/60">Memuat player...</p>
          </div>
        )}
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4 px-4 text-center">
            <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-sm font-medium text-white">Gagal memuat player</p>
            <p className="text-xs text-white/40 mt-1">Coba mirror lain atau refresh halaman</p>
          </div>
        )}
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          onLoad={() => { setIframeLoading(false); setIframeError(false); }}
          onError={() => { setIframeLoading(false); setIframeError(true); }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3 z-10">
          <button onClick={toggleFullscreen} className="rounded-lg bg-white/10 backdrop-blur-sm p-2 text-white hover:bg-white/20 transition-colors">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/30 group"
      onPointerMove={() => {
        setShowControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (playing && !dragging.current) {
          hideTimer.current = setTimeout(() => setShowControls(false), 3000);
        }
      }}
      onPointerLeave={() => { if (playing) setShowControls(false); }}
    >
      {iframeLoading && !iframeError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
          <Loader2 className="h-10 w-10 text-accent animate-spin" />
          <p className="text-sm text-white/60">Memuat player...</p>
        </div>
      )}

      {iframeError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4 px-4 text-center">
          <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <p className="text-sm font-medium text-white">Gagal memuat player</p>
          <p className="text-xs text-white/40 mt-1">Coba mirror lain atau refresh halaman</p>
        </div>
      )}

      {!playing && !iframeError && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
          <span className="h-16 w-16 rounded-full bg-accent/90 flex items-center justify-center hover:bg-accent hover:scale-105 transition-all shadow-lg">
            <Play className="h-7 w-7 text-white ml-1" />
          </span>
        </button>
      )}

      <video
        ref={videoRef}
        key={embedUrl}
        src={embedUrl}
        className="w-full h-full"
        playsInline
        onClick={playing ? handleVideoAreaClick : undefined}
        onLoadedData={() => setIframeLoading(false)}
        onError={() => { setIframeLoading(false); setIframeError(true); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => { if (!dragging.current && videoRef.current) { setCurrentTime(videoRef.current.currentTime); onProgress?.({ seconds: Math.floor(videoRef.current.currentTime), percent: progressPct, duration: videoRef.current.duration }); } }}
        onDurationChange={() => { if (videoRef.current && isFinite(videoRef.current.duration)) setDuration(videoRef.current.duration); }}
      />

      {(showControls || !playing) && !iframeError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-14 pb-3 px-4 z-20 pointer-events-auto">
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/20 rounded cursor-pointer mb-3 group/progress hover:h-2 transition-all relative touch-none"
            onClick={handleProgressClick}
            onPointerDown={handleProgressPointerDown}
          >
            <div className="absolute h-full bg-white/10 rounded" style={{ width: `${buffered}%` }} />
            <div className="absolute h-full bg-accent rounded" style={{ width: `${progressPct}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 opacity-0 group-hover/progress:opacity-100 group-hover/progress:h-3 group-hover/progress:w-3 rounded-full bg-white transition-all" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-accent transition-colors">
                {playing ? <Pause className="h-5 w-5" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button onClick={() => seek(-10)} className="text-white/70 hover:text-white transition-colors" title="Mundur 10s">
                <SkipBack className="h-4 w-4" />
              </button>
              <button onClick={() => seek(10)} className="text-white/70 hover:text-white transition-colors" title="Maju 10s">
                <SkipForward className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = videoRef.current;
                    if (!v) return;
                    const val = parseFloat(e.target.value);
                    v.volume = val;
                    setVolume(val);
                    setMuted(val === 0);
                  }}
                  className="w-0 group-hover/vol:w-20 transition-all h-1 accent-accent cursor-pointer opacity-0 group-hover/vol:opacity-100"
                />
              </div>
              <span className="text-xs text-white/50 tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
