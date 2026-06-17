"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Clock, Film } from "lucide-react";
import type { WatchHistory } from "@/types/user";
import { formatDate } from "@/lib/utils";

interface HistoryTimelineProps {
  history: WatchHistory[];
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins}m lalu`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h lalu`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d lalu`;
  return formatDate(dateStr);
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center">
          <Film className="h-8 w-8 text-muted/30" />
        </div>
        <p className="text-sm text-muted">Belum ada riwayat tontonan.</p>
        <Link href="/browse" className="text-xs text-accent hover:underline">Mulai nonton anime →</Link>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map((item) => (
        <Link
          key={item.id}
          href={`/anime/${item.malId}/${item.episodeNumber}`}
          className="group relative flex gap-3 rounded-xl border border-border/50 bg-surface/30 hover:bg-surface hover:border-accent/30 transition-all duration-200 overflow-hidden"
        >
          {/* Poster */}
          <div className="shrink-0 w-20 h-[4.5rem] rounded-l-xl overflow-hidden bg-surface relative">
            {item.posterUrl ? (
              <Image
                src={item.posterUrl}
                alt={item.animeTitle}
                fill
                sizes="80px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="h-6 w-6 text-muted/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-3 pr-3">
            <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
              {item.animeTitle}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                EP {item.episodeNumber}
              </span>
              {item.episodeTitle && item.episodeTitle !== `Episode ${item.episodeNumber}` && (
                <span className="text-[10px] text-muted/60 line-clamp-1">{item.episodeTitle}</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="h-3 w-3 text-muted/40" />
              <span className="text-[10px] text-muted/50">{relativeTime(item.watchedAt)}</span>
            </div>

            {/* Progress bar */}
            {item.progressPercent > 0 && (
              <div className="mt-2 h-1 w-full rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent/60 group-hover:bg-accent transition-colors"
                  style={{ width: `${Math.min(item.progressPercent, 100)}%` }}
                />
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
