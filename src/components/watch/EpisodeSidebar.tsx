"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { Episode } from "@/types/anime";

interface EpisodeSidebarProps {
  episodes: Episode[];
  malId: number;
  currentEpisode: number;
}

export function EpisodeSidebar({
  episodes,
  malId,
  currentEpisode,
}: EpisodeSidebarProps) {
  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-semibold text-foreground px-2 mb-3">
        Daftar Episode
      </h3>
      <div className="flex flex-col gap-0.5 max-h-[500px] overflow-y-auto">
        {episodes.map((ep, i) => {
          const epNum = Number(ep.episode) || (i + 1);
          const isActive = epNum === currentEpisode;

          return (
            <Link
              key={`${ep.mal_id}-${i}`}
              href={`/anime/${malId}/${epNum}`}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              <div
                className={`shrink-0 h-7 w-7 rounded flex items-center justify-center ${
                  isActive ? "bg-accent/20" : "bg-surface"
                }`}
              >
                {isActive ? (
                  <Play className="h-3.5 w-3.5 fill-accent text-accent" />
                ) : (
                  <span className="text-xs">{epNum}</span>
                )}
              </div>
              <span className="line-clamp-1 flex-1">
                {ep.title && ep.title !== `Episode ${ep.episode}`
                  ? ep.title
                  : `Episode ${ep.episode}`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
