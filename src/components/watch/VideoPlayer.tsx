"use client";

import { useRef, useState, useEffect } from "react";
import { AlertTriangle, Maximize, Minimize, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  embedUrl: string;
}

export function VideoPlayer({ embedUrl }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    setIframeLoading(true);
    setIframeError(false);
  }, [embedUrl]);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (!embedUrl) return null;

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/30 group">
      {/* Loading state */}
      {iframeLoading && !iframeError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-3">
          <Loader2 className="h-10 w-10 text-accent animate-spin" />
          <p className="text-sm text-white/60">Memuat player...</p>
        </div>
      )}

      {/* Error state */}
      {iframeError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4 px-4 text-center">
          <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Gagal memuat player</p>
            <p className="text-xs text-white/40 mt-1">Coba mirror lain atau refresh halaman</p>
          </div>
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

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3 z-10">
        <button
          onClick={toggleFullscreen}
          className="rounded-lg bg-white/10 backdrop-blur-sm p-2 text-white hover:bg-white/20 transition-colors"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
