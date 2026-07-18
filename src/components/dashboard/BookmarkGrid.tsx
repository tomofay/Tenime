"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Download, PlayCircle, CheckCircle2 } from "lucide-react";
import type { Bookmark } from "@/types/user";

interface BookmarkGridProps {
  bookmarks: Bookmark[];
}

export function BookmarkGrid({ bookmarks }: BookmarkGridProps) {
  const [downloadedIds, setDownloadedIds] = useState<Set<number>>(new Set());
  const [animeStatuses, setAnimeStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/anime/downloaded")
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set<number>((d.results || []).map((item: { malId: number }) => item.malId));
        setDownloadedIds(ids);
      })
      .catch(() => {});

    // Refresh status from DB cache (no Jikan dependency)
    if (bookmarks.length > 0) {
      fetch("/api/anime/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ malIds: bookmarks.map((b) => b.malId) }),
      })
        .then((r) => r.json())
        .then((d) => {
          const map: Record<number, string> = {};
          for (const [id, status] of Object.entries(d.results || {}) as [string, string][]) {
            if (status) map[Number(id)] = status;
          }
          setAnimeStatuses(map);
        })
        .catch(() => {});
    }
  }, [bookmarks]);

  if (bookmarks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">Watchlist kamu masih kosong.</p>
      </div>
    );
  }

  function isCompleted(b: Bookmark): boolean {
    const s = animeStatuses[b.malId];
    if (!s) return false;
    const sl = s.toLowerCase();
    return sl === "finished airing" || sl === "complete";
  }

  const completed = bookmarks.filter(isCompleted);
  const ongoing = bookmarks.filter((b) => !isCompleted(b));

  return (
    <div className="space-y-8">
      {ongoing.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-semibold text-foreground">Sedang Tayang</h3>
            <span className="text-xs text-muted">({ongoing.length})</span>
          </div>
          <GridItems items={ongoing} downloadedIds={downloadedIds} />
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">Selesai</h3>
            <span className="text-xs text-muted">({completed.length})</span>
          </div>
          <GridItems items={completed} downloadedIds={downloadedIds} />
        </div>
      )}
    </div>
  );
}

function GridItems({ items, downloadedIds }: { items: Bookmark[]; downloadedIds: Set<number> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((bookmark) => (
        <Link
          key={bookmark.id}
          href={`/anime/${bookmark.malId}`}
          className="group block"
        >
          <div className="relative overflow-hidden rounded-lg bg-surface aspect-[2/3]">
            {bookmark.posterUrl && (
              <Image
                src={bookmark.posterUrl}
                alt={bookmark.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              />
            )}
            {bookmark.score && (
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {bookmark.score.toFixed(1)}
              </div>
            )}
            {downloadedIds.has(bookmark.malId) && (
              <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-green-500/80 px-1.5 py-0.5 text-[10px] text-white">
                <Download className="h-2.5 w-2.5" />
              </div>
            )}
          </div>
          <h3 className="mt-2 text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover:text-accent-hover transition-colors">
            {bookmark.title}
          </h3>
          {bookmark.type && (
            <span className="text-xs text-muted">{bookmark.type}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
