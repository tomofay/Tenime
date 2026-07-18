"use client";

import { RotateCw, SearchX, WifiOff, AlertTriangle } from "lucide-react";
import { useAnimeSearch } from "@/hooks/useAnimeSearch";
import { useFilterStore } from "@/store/useFilterStore";
import { AnimeCard } from "@/components/home/AnimeCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";

export function AnimeGrid() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimeSearch();

  const query = useFilterStore((s) => s.query);

  if (isLoading) {
    return (
      <div className="motion-safe:animate-state-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} size="sm" />)}
      </div>
    );
  }

  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
  const sourceUnavailable = isError && status === 502;

  if (isError) {
    return (
      <div className="motion-safe:animate-state-in flex flex-col items-center justify-center rounded-xl border border-border bg-surface/40 py-16 px-6 text-center">
        {sourceUnavailable ? (
          <>
            <WifiOff className="h-8 w-8 text-muted mb-3" />
            <p className="text-foreground text-sm font-medium">Pencarian sedang tidak bisa diakses.</p>
            <p className="text-muted text-xs mt-1 max-w-xs">Sumber data anime sedang sibuk. Coba lagi beberapa saat lagi.</p>
            <button
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RotateCw className="h-4 w-4" />
              Coba lagi
            </button>
          </>
        ) : (
          <>
            <AlertTriangle className="h-8 w-8 text-muted mb-3" />
            <p className="text-foreground text-sm font-medium">Gagal memuat hasil pencarian.</p>
            <p className="text-muted text-xs mt-1 max-w-xs">Terjadi kesalahan saat mengambil data. Coba lagi.</p>
            <button
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <RotateCw className="h-4 w-4" />
              Coba lagi
            </button>
          </>
        )}
      </div>
    );
  }

  const seen = new Set<number>();
  const allAnime = (data?.pages.flatMap((page) => page.data) ?? [])
    .filter((a): a is NonNullable<typeof a> => !!a)
    .filter((a) => { if (seen.has(a.mal_id)) return false; seen.add(a.mal_id); return true; });

  if (allAnime.length === 0) {
    return (
      <div className="motion-safe:animate-state-in flex flex-col items-center justify-center rounded-xl border border-border bg-surface/40 py-16 px-6 text-center">
        <SearchX className="h-8 w-8 text-muted mb-3" />
        <p className="text-foreground text-sm font-medium">
          {query ? `Tidak ada anime untuk "${query}".` : "Tidak ada anime ditemukan."}
        </p>
        <p className="text-muted text-xs mt-1 max-w-xs">Coba ubah filter atau kata kunci pencarian.</p>
      </div>
    );
  }

  return (
    <InfiniteScroll hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} isError={isError}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
        {allAnime.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} size="sm" />)}
      </div>
    </InfiniteScroll>
  );
}
