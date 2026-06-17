"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Download, Film, ChevronRight } from "lucide-react";
import { useFilterStore } from "@/store/useFilterStore";

interface DownloadedItem {
  malId: number;
  title: string;
  poster: string | null;
  score: number | null;
  type: string | null;
  episodes: number[];
  episodeCount: number;
  qualities: string[];
}

export function DownloadedGrid() {
  const [items, setItems] = useState<DownloadedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/anime/downloaded")
      .then((r) => r.json())
      .then((d) => setItems(d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center">
          <Download className="h-8 w-8 text-muted/30" />
        </div>
        <p className="text-sm text-muted">Belum ada anime yang terdownload.</p>
        <Link href="/browse" className="text-xs text-accent hover:underline">Browse anime →</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((anime) => {
        const lastEp = anime.episodes[anime.episodes.length - 1] || 0;
        const firstEp = anime.episodes[0] || 0;
        return (
          <Link key={anime.malId} href={`/anime/${anime.malId}`} className="group block">
            <div className="relative overflow-hidden rounded-xl bg-surface w-full shadow-sm group-hover:shadow-xl group-hover:shadow-black/30 transition-shadow duration-300 aspect-[2/3]">
              {anime.poster ? (
                <Image src={anime.poster} alt={anime.title} fill sizes="160px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Film className="h-8 w-8 text-muted/20" /></div>
              )}
              <div className="absolute top-2 left-2 rounded-md bg-green-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">{anime.episodeCount} EP</div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-[11px] font-medium text-white line-clamp-1">{anime.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {anime.score && <span className="text-[10px] text-yellow-300">★ {anime.score.toFixed(1)}</span>}
                  <span className="text-[10px] text-white/50">EP {firstEp}-{lastEp}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
