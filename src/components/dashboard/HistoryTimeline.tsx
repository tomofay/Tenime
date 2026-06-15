"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { WatchHistory } from "@/types/user";
import { formatDate } from "@/lib/utils";

interface HistoryTimelineProps {
  history: WatchHistory[];
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">Belum ada riwayat tontonan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {history.map((item) => (
        <Link
          key={item.id}
          href={`/anime/${item.malId}/${item.episodeNumber}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-surface transition-colors group"
        >
          <div className="shrink-0 h-8 w-8 rounded-md bg-surface group-hover:bg-accent/10 flex items-center justify-center transition-colors">
            <Play className="h-4 w-4 text-accent fill-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {item.animeTitle}
            </p>
            <p className="text-xs text-muted">
              Episode {item.episodeNumber}
              {item.episodeTitle && ` — ${item.episodeTitle}`}
            </p>
          </div>
          <span className="text-xs text-muted/60 shrink-0">
            {formatDate(item.watchedAt)}
          </span>
        </Link>
      ))}
    </div>
  );
}
