"use client";

import { useState } from "react";
import { Monitor, Loader2 } from "lucide-react";
import type { MirrorOption } from "@/types/stream";

interface MirrorSelectorProps {
  qualities: { quality: string; mirrors: MirrorOption[] }[];
  onSelectMirror: (embedUrl: string) => void;
}

const qualityOrder = ["1080p", "720p", "480p", "360p"];

export function MirrorSelector({ qualities, onSelectMirror }: MirrorSelectorProps) {
  const [activeQuality, setActiveQuality] = useState("720p");
  const [loadingMirror, setLoadingMirror] = useState<string | null>(null);

  // Filter: only show 720p by default, allow switching
  const sorted = [...qualities].sort(
    (a, b) => qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality)
  );

  const currentQuality = sorted.find((q) => q.quality === activeQuality) ?? sorted[0];

  async function handleMirrorClick(mirror: MirrorOption) {
    const key = `${mirror.id}-${mirror.i}-${mirror.q}`;
    setLoadingMirror(key);

    try {
      const params = new URLSearchParams({
        id: String(mirror.id),
        i: String(mirror.i),
        q: mirror.q,
      });
      const res = await fetch(`/api/mirror?${params}`);
      const data = await res.json();

      if (data.embedUrl) {
        onSelectMirror(data.embedUrl);
      }
    } catch {
      // mirror failed silently
    } finally {
      setLoadingMirror(null);
    }
  }

  if (sorted.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Monitor className="h-3.5 w-3.5 text-muted shrink-0" />

      {/* Quality tabs */}
      <div className="flex items-center gap-1">
        {sorted.map((q) => (
          <button
            key={q.quality}
            onClick={() => setActiveQuality(q.quality)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              activeQuality === q.quality
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {q.quality}
          </button>
        ))}
      </div>

      <span className="text-border text-xs">|</span>

      {/* Mirror buttons */}
      <div className="flex flex-wrap gap-1.5">
        {currentQuality.mirrors.map((mirror) => {
          const key = `${mirror.id}-${mirror.i}-${mirror.q}`;
          const isLoading = loadingMirror === key;

          return (
            <button
              key={key}
              onClick={() => handleMirrorClick(mirror)}
              disabled={isLoading}
              className="inline-flex items-center gap-1 rounded-md bg-surface hover:bg-surface-hover disabled:opacity-50 px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors"
            >
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              {mirror.name.trim()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
