"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { Episode } from "@/types/anime";

interface EpisodeListProps {
  episodes: Episode[];
  malId: number;
}

export function EpisodeList({ episodes, malId }: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">Belum ada episode tersedia.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {episodes.map((ep, i) => (
        <Link
          key={`${ep.mal_id}-${i}`}
          href={`/anime/${malId}/${ep.episode || (i + 1)}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface transition-colors group"
        >
          {/* Play icon */}
          <div className="shrink-0 h-8 w-8 rounded-md bg-surface group-hover:bg-accent/10 flex items-center justify-center transition-colors">
            <Play className="h-4 w-4 text-accent fill-accent" />
          </div>

          {/* Episode info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">
              Episode {ep.episode}
              {ep.title &&
                ep.title !== `Episode ${ep.episode}` &&
                `: ${ep.title}`}
            </p>
          </div>

          {/* Arrow */}
          <span className="text-muted text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
