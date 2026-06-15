"use client";

import { useState, useCallback, use } from "react";
import Link from "next/link";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { useAnimeEpisodes } from "@/hooks/useAnimeEpisodes";
import { useVideoSource } from "@/hooks/useVideoSource";
import { VideoPlayer } from "@/components/watch/VideoPlayer";
import { MirrorSelector } from "@/components/watch/MirrorSelector";
import { DownloadSection } from "@/components/watch/DownloadSection";
import { EpisodeSidebar } from "@/components/watch/EpisodeSidebar";
import { NextPrevButtons } from "@/components/watch/NextPrevButtons";
import { ChevronLeft } from "lucide-react";

export default function WatchPage({
  params,
}: {
  params: Promise<{ malId: string; episodeNumber: string }>;
}) {
  const { malId, episodeNumber } = use(params);
  const id = Number(malId);
  const ep = Number(episodeNumber);

  const { data: animeDetail } = useAnimeDetail(id);
  const anime = animeDetail?.data;
  const { data: episodesData } = useAnimeEpisodes(id);
  const { data: streamSource, isLoading, isError } = useVideoSource(
    id,
    ep,
    anime?.title
  );

  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>("");

  // Set initial embed when source loads
  const embedUrl = activeEmbedUrl || streamSource?.embedUrl || "";

  const handleMirrorChange = useCallback((newEmbedUrl: string) => {
    setActiveEmbedUrl(newEmbedUrl);
  }, []);

  const episodes = episodesData?.data ?? [];
  const totalEpisodes = anime?.episodes ?? episodes.length;
  const currentEpisodeTitle =
    episodes.find((e) => Number(e.episode) === ep)?.title ?? "";
  const displayTitle =
    currentEpisodeTitle && currentEpisodeTitle !== `Episode ${ep}`
      ? currentEpisodeTitle
      : `Episode ${ep}`;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-4 sm:py-6 w-full">
      <Link
        href={`/anime/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Kembali ke detail
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {isLoading && (
            <div className="w-full aspect-video bg-surface rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-sm text-muted">Mencari sumber video...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="w-full aspect-video bg-surface rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <p className="text-sm text-muted">
                  Gagal menemukan episode ini di server streaming.
                </p>
              </div>
            </div>
          )}

          {streamSource && !isLoading && streamSource.embedUrl && (
            <VideoPlayer embedUrl={embedUrl} />
          )}

          {streamSource && !isLoading && !streamSource.embedUrl && (
            <div className="w-full aspect-video bg-surface rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <p className="text-sm text-muted">
                  Sumber video tidak ditemukan. Coba episode lain.
                </p>
              </div>
            </div>
          )}

          {/* Mirror selector with real switching */}
          {streamSource?.qualities && streamSource.qualities.length > 0 && (
            <div className="mt-3">
              <MirrorSelector
                qualities={streamSource.qualities}
                onSelectMirror={handleMirrorChange}
              />
            </div>
          )}

          {/* Download section */}
          <DownloadSection
            mirrors={streamSource?.mirrors ?? []}
            malId={id}
            episode={ep}
          />

          <div className="mt-4">
            <h1 className="text-lg font-semibold text-foreground">
              {anime?.title ?? "Loading..."}
            </h1>
            <p className="text-sm text-muted mt-0.5">{displayTitle}</p>
            <div className="mt-3">
              <NextPrevButtons
                malId={id}
                currentEpisode={ep}
                totalEpisodes={totalEpisodes}
              />
            </div>
          </div>
        </div>

        <div className="lg:w-72 shrink-0">
          <EpisodeSidebar
            episodes={episodes}
            malId={id}
            currentEpisode={ep}
          />
        </div>
      </div>
    </div>
  );
}
