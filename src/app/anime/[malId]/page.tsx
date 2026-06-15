"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { useAnimeEpisodes } from "@/hooks/useAnimeEpisodes";
import { DetailHero } from "@/components/detail/DetailHero";
import { TabNavigation, type Tab } from "@/components/detail/TabNavigation";
import { EpisodeList } from "@/components/detail/EpisodeList";
import { RelationsTab } from "@/components/detail/RelationsTab";
import { BatchDownloadButton } from "@/components/detail/BatchDownloadButton";
import { Download, CheckCircle2 } from "lucide-react";

export default function AnimeDetailPage({
  params,
}: {
  params: Promise<{ malId: string }>;
}) {
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
        <h1 className="text-xl font-bold text-foreground">
          Anime tidak ditemukan
        </h1>
        <Link href="/browse" className="mt-4 text-sm text-accent hover:underline">
          ← Kembali ke Browse
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Status badges */}
      <div className="max-w-7xl mx-auto px-4 pt-4 flex flex-wrap items-center gap-2">
        {isCached && (
          <span className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Tersimpan offline
          </span>
        )}
        {isStale && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
            Data lama (offline mode)
          </span>
        )}
        {downloadStatus?.downloaded && (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
            <CheckCircle2 className="h-3 w-3" />
            Episode terdownload
          </span>
        )}
        {!downloadStatus?.downloaded && (
          <span className="inline-flex items-center gap-1 rounded bg-surface border border-border px-2 py-0.5 text-xs text-muted">
            <Download className="h-3 w-3" />
            Belum download
          </span>
        )}
      </div>

      <DetailHero anime={anime} />
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Extended Info */}
              {anime.producers && anime.producers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Producers</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.producers.map((p) => (
                      <span key={p.mal_id} className="rounded-md bg-surface px-2.5 py-0.5 text-xs text-muted">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anime.licensors && anime.licensors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Licensors</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.licensors.map((l) => (
                      <span key={l.mal_id} className="rounded-md bg-surface px-2.5 py-0.5 text-xs text-muted">
                        {l.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {anime.themes && anime.themes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Themes</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.themes.map((t) => (
                      <Link
                        key={t.mal_id}
                        href={`/browse?genres=${t.mal_id}`}
                        className="rounded-full border border-border px-3 py-0.5 text-xs text-muted hover:text-foreground hover:border-accent/50 transition-colors"
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {anime.demographics && anime.demographics.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Demographics</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.demographics.map((d) => (
                      <Link
                        key={d.mal_id}
                        href={`/browse?genres=${d.mal_id}`}
                        className="rounded-full border border-border px-3 py-0.5 text-xs text-muted hover:text-foreground hover:border-accent/50 transition-colors"
                      >
                        {d.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {anime.background && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Background</h3>
                  <p className="text-sm text-muted leading-relaxed">{anime.background}</p>
                </div>
              )}

              {anime.external && anime.external.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">External Links</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.external.map((ext) => (
                      <a
                        key={ext.url}
                        href={ext.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-surface px-2.5 py-0.5 text-xs text-accent hover:bg-surface-hover transition-colors"
                      >
                        {ext.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {anime.streaming && anime.streaming.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Streaming</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {anime.streaming.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-surface px-2.5 py-0.5 text-xs text-accent hover:bg-surface-hover transition-colors"
                      >
                        {s.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!anime.background && !anime.producers?.length && !anime.licensors?.length && !anime.themes?.length && !anime.demographics?.length && !anime.external?.length && (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted">Tidak ada informasi tambahan.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "episodes" && (
            <div className="space-y-4">
              <BatchDownloadButton
                malId={id}
                animeTitle={anime.title}
                totalEpisodes={anime.episodes || episodesData?.data?.length || 0}
              />
              <EpisodeList episodes={episodesData?.data ?? []} malId={id} />
            </div>
          )}

          {activeTab === "relations" && (
            <RelationsTab relations={anime.relations ?? []} />
          )}

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
