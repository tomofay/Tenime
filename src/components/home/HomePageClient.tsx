"use client";

import { useTrendingAnime } from "@/hooks/useTrendingAnime";
import { useSeasonalAnime } from "@/hooks/useSeasonalAnime";
import { usePopularAnime } from "@/hooks/usePopularAnime";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Section } from "@/components/home/Section";
import { AnimeCard } from "@/components/home/AnimeCard";
import { ContinueWatchingSection } from "@/components/home/ContinueWatchingSection";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { WifiOff } from "lucide-react";

function dedupByMalId<T extends { mal_id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  return arr.filter((a) => { if (seen.has(a.mal_id)) return false; seen.add(a.mal_id); return true; });
}

export function HomePageClient() {
  const trending = useTrendingAnime();
  const seasonal = useSeasonalAnime();
  const popular = usePopularAnime();
  const { data: isOffline } = useOfflineMode();
  const { data: continueWatching } = useContinueWatching();

  const seasonalAnimeList = dedupByMalId(seasonal.data ?? []).slice(0, 8);

  return (
    <div>
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-400">Mode offline — menampilkan data dari cache lokal</span>
          </div>
        </div>
      )}

      {seasonalAnimeList.length > 0 ? (
        <HeroCarousel animeList={seasonalAnimeList} />
      ) : (
        <div className="w-full h-[85vh] sm:h-[90vh] max-h-[800px] bg-surface animate-pulse" />
      )}

      {continueWatching && continueWatching.length > 0 && (
        <ContinueWatchingSection entries={continueWatching} />
      )}

      <Section title="Trending Sekarang" variant="horizontal" seeAllHref="/browse?sort=score&dir=desc">
        {trending.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : trending.isError || !trending.data
          ? <EmptyState message="Gagal memuat trending anime." submessage="Coba refresh halaman." />
          : dedupByMalId(trending.data).slice(0, 12).map((anime, i) => (
              <AnimeCard key={`trending-${anime.mal_id}`} anime={anime} rank={i + 1} index={i} />
            ))}
      </Section>

      <Section title="Musim Ini" variant="grid" seeAllHref="/browse?status=airing">
        {seasonal.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : seasonal.isError || !seasonal.data
          ? <EmptyState message="Gagal memuat anime musim ini." submessage="Coba refresh halaman." />
          : dedupByMalId(seasonal.data).slice(0, 12).map((anime) => (
              <AnimeCard key={`seasonal-${anime.mal_id}`} anime={anime} size="sm" />
            ))}
      </Section>

      <Section title="Paling Populer" variant="horizontal" seeAllHref="/browse?sort=popularity&dir=asc">
        {popular.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : popular.isError || !popular.data
          ? <EmptyState message="Gagal memuat anime populer." submessage="Coba refresh halaman." />
          : dedupByMalId(popular.data).slice(0, 12).map((anime) => (
              <AnimeCard key={`popular-${anime.mal_id}`} anime={anime} />
            ))}
      </Section>
    </div>
  );
}
