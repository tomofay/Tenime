"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Clock, Film, RotateCcw } from "lucide-react";
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
  if (diffHrs < 24) return `${diffHrs}j lalu`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}h lalu`;
  return formatDate(dateStr);
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return formatDate(dateStr);
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function groupByDay(items: WatchHistory[]): { label: string; items: WatchHistory[] }[] {
  const groups = new Map<string, WatchHistory[]>();
  for (const item of items) {
    const key = dayLabel(item.watchedAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const order = ["Hari ini", "Kemarin"];
  return [...groups.entries()]
    .sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return new Date(b[1][0].watchedAt).getTime() - new Date(a[1][0].watchedAt).getTime();
    })
    .map(([label, items]) => ({ label, items }));
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

  const sorted = [...history].sort(
    (a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
  );
  const groups = groupByDay(sorted);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            {group.label}
            <span className="text-muted/50 font-normal">({group.items.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.items.map((item) => {
              const pct = Math.min(Math.max(item.progressPercent, 0), 100);
              const done = pct >= 98;
              const hasResume = item.progressSeconds > 0 && !done;
              return (
                <Link
                  key={item.id}
                  href={`/anime/${item.malId}/${item.episodeNumber}`}
                  className="group relative flex gap-3 rounded-xl border border-border/50 bg-surface/30 hover:bg-surface hover:border-accent/40 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                      <div className="w-full h-full flex items-center justify-center bg-surface-hover">
                        <Film className="h-6 w-6 text-muted/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-3 w-3 fill-white" />
                        {done ? "Ulang" : "Lanjut"}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-3 pr-3">
                    <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-snug">
                      {item.animeTitle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                        EP {item.episodeNumber}
                      </span>
                      {item.episodeTitle && item.episodeTitle !== `Episode ${item.episodeNumber}` && (
                        <span className="text-[10px] text-muted/60 line-clamp-1 min-w-0">{item.episodeTitle}</span>
                      )}
                    </div>

                    {/* Resume / last watched */}
                    <div className="flex items-center gap-1 mt-1.5 text-[10px]">
                      {hasResume ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-accent font-medium">
                          <RotateCcw className="h-3 w-3" />
                          <span>{formatTime(item.progressSeconds)}</span>
                        </span>
                      ) : done ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-green-400 font-medium">
                          <Play className="h-3 w-3 fill-green-400" />
                          <span>Tamat</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted/50">
                          <Clock className="h-3 w-3" />
                          <span>{relativeTime(item.watchedAt)}</span>
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {pct > 0 && (
                      <div className="mt-2 h-1 w-full rounded-full bg-surface overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-colors ${done ? "bg-green-500/70" : "bg-accent/70 group-hover:bg-accent"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
