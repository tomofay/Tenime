"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";

interface NextPrevButtonsProps {
  malId: number;
  currentEpisode: number;
  totalEpisodes: number;
}

export function NextPrevButtons({
  malId,
  currentEpisode,
  totalEpisodes,
}: NextPrevButtonsProps) {
  const autoplay = usePlayerStore((s) => s.autoplay);
  const toggleAutoplay = usePlayerStore((s) => s.toggleAutoplay);

  const hasPrev = currentEpisode > 1;
  const hasNext = currentEpisode < totalEpisodes;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            href={`/anime/${malId}/${currentEpisode - 1}`}
            className="flex items-center gap-1.5 rounded-md bg-surface hover:bg-surface-hover px-3 py-1.5 text-sm text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 rounded-md bg-surface/50 px-3 py-1.5 text-sm text-muted/40 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
            Prev
          </span>
        )}

        {hasNext ? (
          <Link
            href={`/anime/${malId}/${currentEpisode + 1}`}
            className="flex items-center gap-1.5 rounded-md bg-surface hover:bg-surface-hover px-3 py-1.5 text-sm text-foreground transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 rounded-md bg-surface/50 px-3 py-1.5 text-sm text-muted/40 cursor-not-allowed">
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>

      <button
        onClick={toggleAutoplay}
        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
          autoplay
            ? "bg-accent/10 text-accent"
            : "bg-surface text-muted hover:text-foreground"
        }`}
      >
        Auto-play {autoplay ? "ON" : "OFF"}
      </button>
    </div>
  );
}
