"use client";

import { useTrendingAnime } from "@/hooks/useTrendingAnime";
import { useSeasonalAnime } from "@/hooks/useSeasonalAnime";
import { usePopularAnime } from "@/hooks/usePopularAnime";
import { useOfflineMode, useOfflineAnimeList } from "@/hooks/useOfflineAnime";
import { HeroBanner } from "@/components/home/HeroBanner";
import { Section } from "@/components/home/Section";
import { AnimeCard } from "@/components/home/AnimeCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckCircle2, WifiOff, Download } from "lucide-react";

function dedupByMalId<T extends { mal_id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  return arr.filter((a) => {
    if (seen.has(a.mal_id)) return false;
    seen.add(a.mal_id);
    return true;
  });
}

export function HomePageClient() {
  const trending = useTrendingAnime();
  const seasonal = useSeasonalAnime();
  const popular = usePopularAnime();
  const { data: isOffline } = useOfflineMode();
  const { data: offlineList } = useOfflineAnimeList();

  const heroAnime = trending.data?.[0] ?? seasonal.data?.[0] ?? null;

  return (
    <div>
      {/* Offline mode banner */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-400">
              Mode offline — menampilkan data dari cache lokal
            </span>
          </div>
        </div>
      )}

      {heroAnime && <HeroBanner anime={heroAnime} />}

      {/* Downloaded anime section */}
      {offlineList && offlineList.count > 0 && (
        <Section title={`Tersimpan Lokal (${offlineList.count})`} variant="horizontal">
          {offlineList.results.map((item) => (
            <div key={item.malId} className="relative shrink-0">
              <AnimeCard
                anime={{
                  mal_id: item.malId,
                  title: item.title,
                  images: { webp: { large_image_url: item.poster ?? "" }, jpg: { large_image_url: item.poster ?? "", image_url: "", small_image_url: "" } },
                  score: item.score ?? 0,
                  episodes: item.episodes,
                  type: item.type,
                } as any}
              />
              {item.downloaded && (
                <span className="absolute top-2 right-2 rounded bg-green-500/80 px-1.5 py-0.5 text-[10px] text-white flex items-center gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  <Download className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
          ))}
        </Section>
      )}

      <Section title="Trending Sekarang" variant="horizontal">
        {trending.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : trending.isError || !trending.data
          ? <EmptyState message="Gagal memuat trending anime." submessage="Coba refresh halaman." />
          : dedupByMalId(trending.data).slice(0, 12).map((anime, i) => (
              <div key={`trending-${anime.mal_id}-${i}`} className="relative shrink-0">
                <AnimeCard anime={anime} />
                {offlineList?.results?.find((o) => o.malId === anime.mal_id)?.downloaded && (
                  <span className="absolute top-2 right-2 rounded bg-green-500/80 px-1.5 py-0.5 text-[10px] text-white flex items-center gap-0.5">
                    <Download className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            ))}
      </Section>

      <Section title="Musim Ini" variant="grid">
        {seasonal.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : seasonal.isError || !seasonal.data
          ? <EmptyState message="Gagal memuat anime musim ini." submessage="Coba refresh halaman." />
          : dedupByMalId(seasonal.data).slice(0, 12).map((anime, i) => (
              <AnimeCard key={`seasonal-${anime.mal_id}-${i}`} anime={anime} size="sm" />
            ))}
      </Section>

      <Section title="Paling Populer" variant="horizontal">
        {popular.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : popular.isError || !popular.data
          ? <EmptyState message="Gagal memuat anime populer." submessage="Coba refresh halaman." />
          : dedupByMalId(popular.data).slice(0, 12).map((anime, i) => (
              <div key={`popular-${anime.mal_id}-${i}`} className="relative shrink-0">
                <AnimeCard anime={anime} />
                {offlineList?.results?.find((o) => o.malId === anime.mal_id)?.downloaded && (
                  <span className="absolute top-2 right-2 rounded bg-green-500/80 px-1.5 py-0.5 text-[10px] text-white flex items-center gap-0.5">
                    <Download className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            ))}
      </Section>
    </div>
  );
}
