"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { useAnimeEpisodes } from "@/hooks/useAnimeEpisodes";
import { DetailHero } from "@/components/detail/DetailHero";
import { TabNavigation, type Tab } from "@/components/detail/TabNavigation";
import { EpisodeList } from "@/components/detail/EpisodeList";
import { RelationsTab } from "@/components/detail/RelationsTab";
import { CharactersTab } from "@/components/detail/CharactersTab";
import { BatchDownloadButton } from "@/components/detail/BatchDownloadButton";

export default function AnimeDetailPage({ params }: { params: Promise<{ malId: string }> }) {
  const { malId } = use(params);
  const id = Number(malId);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: response, isLoading: animeLoading, isError: animeError } = useAnimeDetail(id);
  const { data: episodesData } = useAnimeEpisodes(id);

  const anime = response?.data;
  const isCached = response?.cached ?? false;
  const isStale = response?.stale ?? false;
  const downloadStatus = response?.downloadStatus;

  if (animeLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (animeError || !anime) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32">
        <h1 className="text-xl font-bold text-foreground">Anime tidak ditemukan</h1>
        <Link href="/browse" className="mt-4 text-sm text-accent hover:underline">← Kembali ke Browse</Link>
      </div>
    );
  }

  return (
    <div>
      <DetailHero anime={anime} isCached={isCached} isStale={isStale} downloadStatus={downloadStatus} />

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {anime.background && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Background</h3>
                  <p className="text-sm text-muted leading-relaxed">{anime.background}</p>
                </div>
              )}
              {(!anime.background) && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted">Tidak ada informasi tambahan.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "episodes" && (
            <div className="space-y-4">
              <BatchDownloadButton malId={id} animeTitle={anime.title} totalEpisodes={anime.episodes || episodesData?.data?.length || 0} />
              <EpisodeList episodes={episodesData?.data ?? []} malId={id} />
            </div>
          )}

          {activeTab === "characters" && <CharactersTab malId={id} />}

          {activeTab === "relations" && <RelationsTab relations={anime.relations ?? []} />}

          {activeTab === "trailer" && (
            <>
              {anime.trailer?.embed_url ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-surface">
                  <iframe src={anime.trailer.embed_url} title="Trailer" className="w-full h-full" allowFullScreen />
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted">Trailer tidak tersedia.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
