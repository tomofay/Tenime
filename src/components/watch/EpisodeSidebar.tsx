"use client";

import Link from "next/link";
import { Play, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import type { Episode } from "@/types/anime";
import { usePlayerStore } from "@/store/usePlayerStore";

interface EpisodeSidebarProps {
  episodes: Episode[];
  malId: number;
  currentEpisode: number;
}

export function EpisodeSidebar({ episodes, malId, currentEpisode }: EpisodeSidebarProps) {
  const autoplay = usePlayerStore((s) => s.autoplay);
  const toggleAutoplay = usePlayerStore((s) => s.toggleAutoplay);

  const hasPrev = currentEpisode > 1;
  const hasNext = episodes.length > 0 && currentEpisode < Number(episodes[episodes.length - 1].episode || episodes.length);

  return (
    <div className="flex flex-col h-full">
      {/* Header with autoplay */}
      <div className="flex items-center justify-between px-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground">Episode</h3>
        <button
          onClick={toggleAutoplay}
          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] transition-colors ${
            autoplay ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          <Repeat className="h-3 w-3" />
          Auto
        </button>
      </div>

      {/* Quick nav */}
      <div className="flex items-center gap-1 mb-3 px-2">
        {hasPrev ? (
          <Link
            href={`/anime/${malId}/${currentEpisode - 1}`}
            className="flex items-center gap-1 rounded-md bg-surface hover:bg-surface-hover px-3 py-1.5 text-xs text-foreground transition-colors flex-1 justify-center"
          >
            <ChevronLeft className="h-3.5 w-3.5" />Prev
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-md bg-surface/30 px-3 py-1.5 text-xs text-muted/30 flex-1 justify-center cursor-not-allowed">
            <ChevronLeft className="h-3.5 w-3.5" />Prev
          </span>
        )}
        {hasNext ? (
          <Link
            href={`/anime/${malId}/${currentEpisode + 1}`}
            className="flex items-center gap-1 rounded-md bg-surface hover:bg-surface-hover px-3 py-1.5 text-xs text-foreground transition-colors flex-1 justify-center"
          >
            Next<ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 rounded-md bg-surface/30 px-3 py-1.5 text-xs text-muted/30 flex-1 justify-center cursor-not-allowed">
            Next<ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {/* Episode list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 max-h-[600px]">
        {episodes.map((ep, i) => {
          const epNum = Number(ep.episode) || (i + 1);
          const isActive = epNum === currentEpisode;

          return (
            <Link
              key={`${ep.mal_id}-${i}`}
              href={`/anime/${malId}/${epNum}`}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-accent text-white shadow-lg shadow-accent/20 font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              <div className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                isActive ? "bg-white/20" : "bg-surface text-muted"
              }`}>
                {isActive ? <Play className="h-3.5 w-3.5 fill-white text-white" /> : epNum}
              </div>
              <span className="line-clamp-1 flex-1 text-xs">
                {ep.title && ep.title !== `Episode ${ep.episode}` ? ep.title : `Episode ${epNum}`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
