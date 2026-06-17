"use client";

import { useState, useEffect } from "react";
import { useAnimeSearch } from "@/hooks/useAnimeSearch";
import { useFilterStore } from "@/store/useFilterStore";
import { AnimeCard } from "@/components/home/AnimeCard";
import { toAnimeCardData } from "@/lib/anime-card-data";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";

export function AnimeGrid() {
  const downloadedOnly = useFilterStore((s) => s.downloadedOnly);
  const [downloadedItems, setDownloadedItems] = useState<any[]>([]);
  const [dlLoading, setDlLoading] = useState(false);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimeSearch();

  // Fetch downloaded list when toggle is ON
  useEffect(() => {
    if (!downloadedOnly) return;
    setDlLoading(true);
    fetch("/api/anime/downloaded")
      .then((r) => r.json())
      .then((d) => setDownloadedItems(d.results || []))
      .catch(() => setDownloadedItems([]))
      .finally(() => setDlLoading(false));
  }, [downloadedOnly]);

  // When "downloaded only" is active, render directly from the downloaded API
  if (downloadedOnly) {
    if (dlLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} size="sm" />)}
        </div>
      );
    }

    if (downloadedItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted text-sm">Belum ada anime yang terdownload.</p>
          <p className="text-muted/60 text-xs mt-1">Download beberapa anime terlebih dahulu dari halaman streaming.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {downloadedItems.map((item) => (
          <AnimeCard key={item.malId} anime={toAnimeCardData(item)} size="sm" />
        ))}
      </div>
    );
  }

  // Normal search mode
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} size="sm" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted text-sm">Gagal memuat anime.</p>
        <p className="text-muted/60 text-xs mt-1">Coba lagi nanti.</p>
      </div>
    );
  }

  const seen = new Set<number>();
  const allAnime = (data?.pages.flatMap((page) => page.data) ?? [])
    .filter((a): a is NonNullable<typeof a> => !!a)
    .filter((a, i, arr) => { if (seen.has(a.mal_id)) return false; seen.add(a.mal_id); return true; });

  if (allAnime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted text-sm">Tidak ada anime ditemukan.</p>
        <p className="text-muted/60 text-xs mt-1">Coba ubah filter atau kata kunci pencarian.</p>
      </div>
    );
  }

  return (
    <InfiniteScroll hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allAnime.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} size="sm" />)}
      </div>
    </InfiniteScroll>
  );
}
