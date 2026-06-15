"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AlertTriangle, Maximize, Minimize } from "lucide-react";

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

  if (!embedUrl) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
    >
      {iframeLoading && !iframeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm text-muted">Memuat player...</p>
          </div>
        </div>
      )}

      {iframeError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 gap-3 px-4 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <p className="text-sm text-muted">Gagal memuat player.</p>
          <p className="text-xs text-muted/60">
            Coba mirror lain di bawah.
          </p>
        </div>
      )}

      <iframe
        key={embedUrl}
        src={embedUrl}
        className="w-full h-full"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        onLoad={() => { setIframeLoading(false); setIframeError(false); }}
        onError={() => { setIframeLoading(false); setIframeError(true); }}
      />

      <button
        onClick={toggleFullscreen}
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-black/60 p-1.5 text-white hover:bg-black/80 z-20"
        aria-label="Toggle fullscreen"
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  );
}
