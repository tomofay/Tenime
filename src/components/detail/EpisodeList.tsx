"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Download } from "lucide-react";
import type { Episode } from "@/types/anime";

interface EpisodeListProps {
  episodes: Episode[];
  malId: number;
}

export function EpisodeList({ episodes, malId }: EpisodeListProps) {
  const [downloadedEps, setDownloadedEps] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`/api/anime/${malId}/episodes-local`)
      .then((r) => r.json())
      .then((d) => {
        const eps = new Set<number>();
        (d.data || []).forEach((e: { episode: string; episodeNumber?: number }) => {
          eps.add(e.episodeNumber ?? Number(e.episode));
        });
        setDownloadedEps(eps);
      })
      .catch(() => {});
  }, [malId]);

  if (episodes.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">Belum ada episode tersedia.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {episodes.map((ep, i) => {
        const epNum = Number(ep.episode) || (i + 1);
        const isDownloaded = downloadedEps.has(epNum);

        return (
          <Link
            key={`${ep.mal_id}-${i}`}
            href={`/anime/${malId}/${ep.episode || (i + 1)}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface transition-colors group"
          >
            <div className="shrink-0 h-8 w-8 rounded-md bg-surface group-hover:bg-accent/10 flex items-center justify-center transition-colors">
              <span className="text-xs font-semibold text-muted group-hover:text-accent transition-colors">
                {epNum}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-1">
                Episode {epNum}
                {ep.title &&
                  ep.title !== `Episode ${epNum}` &&
                  `: ${ep.title}`}
              </p>
            </div>

            {isDownloaded && (
              <div className="shrink-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-green-400 bg-green-500/10">
                <Download className="h-3 w-3" />
              </div>
            )}

            <span className="text-muted text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
