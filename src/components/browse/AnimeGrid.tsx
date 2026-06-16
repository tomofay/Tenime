"use client";

import { useAnimeSearch } from "@/hooks/useAnimeSearch";
import { AnimeCard } from "@/components/home/AnimeCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";

export function AnimeGrid() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimeSearch();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} size="sm" />
        ))}
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
        <p className="text-muted/60 text-xs mt-1">
          Coba ubah filter atau kata kunci pencarian.
        </p>
      </div>
    );
  }

  return (
    <InfiniteScroll
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allAnime.map((anime) => (
          <AnimeCard key={anime.mal_id} anime={anime} size="sm" />
        ))}
      </div>
    </InfiniteScroll>
  );
}
