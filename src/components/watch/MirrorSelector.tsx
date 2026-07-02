"use client";

import { useState } from "react";
import { Monitor, Loader2, AlertCircle } from "lucide-react";
import type { MirrorOption } from "@/types/stream";

interface MirrorSelectorProps {
  qualities: { quality: string; mirrors: MirrorOption[] }[];
  onSelectMirror: (embedUrl: string, directVideo?: boolean) => void;
}

const qualityOrder = ["1080p", "720p", "480p", "360p"];

export function MirrorSelector({ qualities, onSelectMirror }: MirrorSelectorProps) {
  const [activeQuality, setActiveQuality] = useState("720p");
  const [loadingMirror, setLoadingMirror] = useState<string | null>(null);
  const [failedMirrors, setFailedMirrors] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  const sorted = [...qualities].sort((a, b) => qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality));
  const currentQuality = sorted.find((q) => q.quality === activeQuality) ?? sorted[0];

  async function handleMirrorClick(mirror: MirrorOption, idx: number) {
    const key = `${mirror.id}-${mirror.i}-${mirror.q}`;
    setLoadingMirror(key);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/mirror?id=${mirror.id}&i=${mirror.i}&q=${mirror.q}`);
      const data = await res.json();
      if (data.embedUrl) {
        onSelectMirror(data.embedUrl, !!data.directVideo);
        setFailedMirrors((prev) => { const next = new Set(prev); next.delete(key); return next; });
      } else {
        setFailedMirrors((prev) => new Set(prev).add(key));
        setErrorMsg(`Mirror ${idx + 1} tidak tersedia. Coba mirror lain.`);
      }
    } catch {
      setFailedMirrors((prev) => new Set(prev).add(key));
      setErrorMsg(`Gagal menghubungi Mirror ${idx + 1}.`);
    } finally {
      setLoadingMirror(null);
    }
  }

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl bg-surface/50 border border-border/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Monitor className="h-3.5 w-3.5 text-muted shrink-0" />
        <span className="text-xs font-medium text-muted">Mirror</span>
        <div className="flex items-center gap-1 ml-2">
          {sorted.map((q) => (
            <button
              key={q.quality}
              onClick={() => setActiveQuality(q.quality)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                activeQuality === q.quality
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {q.quality}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {currentQuality?.mirrors.map((mirror, idx) => {
          const key = `${mirror.id}-${mirror.i}-${mirror.q}`;
          const isLoading = loadingMirror === key;
          const isFailed = failedMirrors.has(key);
          return (
            <button
              key={key}
              onClick={() => handleMirrorClick(mirror, idx)}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg bg-surface hover:bg-surface-hover disabled:opacity-50 px-3 py-1.5 text-xs transition-colors border ${
                isFailed ? "text-red-400 border-red-500/20" : "text-muted hover:text-foreground border-border/50"
              }`}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : isFailed && <AlertCircle className="h-3 w-3 text-red-400" />}
              Mirror {idx + 1}
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <p className="text-[11px] text-red-400/80 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
