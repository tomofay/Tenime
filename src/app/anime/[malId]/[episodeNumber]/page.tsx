"use client";

import { useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { useAnimeEpisodes } from "@/hooks/useAnimeEpisodes";
import { useVideoSource } from "@/hooks/useVideoSource";
import { useAutoplay } from "@/hooks/useAutoplay";
import { useAutoSaveHistory } from "@/hooks/useAutoSaveHistory";
import { VideoPlayer } from "@/components/watch/VideoPlayer";
import { MirrorSelector } from "@/components/watch/MirrorSelector";
import { DownloadSection } from "@/components/watch/DownloadSection";
import { EpisodeSidebar } from "@/components/watch/EpisodeSidebar";
import { EpisodeComments } from "@/components/watch/EpisodeComments";
import { ChevronLeft, Star } from "lucide-react";

export default function WatchPage({ params }: { params: Promise<{ malId: string; episodeNumber: string }> }) {
  const { malId, episodeNumber } = use(params);
  const id = Number(malId);
  const ep = Number(episodeNumber);

  const { data: animeDetail } = useAnimeDetail(id);
  const anime = animeDetail?.data;
  const { data: episodesData } = useAnimeEpisodes(id);
  const { data: streamSource, isLoading, isError } = useVideoSource(id, ep, anime?.title);

  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string>("");
  const [isDirectVideo, setIsDirectVideo] = useState(false);
  const embedUrl = activeEmbedUrl || streamSource?.embedUrl || "";

  const handleMirrorChange = useCallback((newEmbedUrl: string, directVideo?: boolean) => {
    setActiveEmbedUrl(newEmbedUrl);
    setIsDirectVideo(!!directVideo);
  }, []);

  const episodes = episodesData?.data ?? [];
  const totalEpisodes = episodes.length;
  const currentEpisodeTitle = episodes.find((e) => Number(e.episode) === ep)?.title ?? "";
  const displayTitle = currentEpisodeTitle && currentEpisodeTitle !== `Episode ${ep}` ? currentEpisodeTitle : `Episode ${ep}`;

  const isPlaying = !!streamSource && !isLoading && !!streamSource.embedUrl;
  useAutoplay({ malId: id, currentEpisode: ep, totalEpisodes, isPlaying });
  const { reportProgress } = useAutoSaveHistory(id, ep, anime?.title ?? "", anime?.images?.webp?.large_image_url, currentEpisodeTitle);

  const lastReportRef = useRef<number>(0);
  const handleProgress = useCallback((p: { seconds: number; percent: number; duration: number }) => {
    const now = Date.now();
    if (now - lastReportRef.current < 15_000) return;
    lastReportRef.current = now;
    reportProgress(p);
  }, [reportProgress]);

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-4 sm:py-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/anime/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{anime?.title ?? "Loading..."}</span>
        </Link>
        {anime?.score && <span className="inline-flex items-center gap-1 text-xs text-muted"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{anime.score.toFixed(1)}</span>}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/30">
            {isLoading && <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center"><div className="flex flex-col items-center gap-3"><div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" /><p className="text-sm text-white/60">Mencari sumber video...</p></div></div>}
            {isError && <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center"><div className="flex flex-col items-center gap-3 text-center px-4"><p className="text-sm text-white/60">Gagal menemukan episode ini.</p></div></div>}
            {streamSource && !isLoading && streamSource.embedUrl && <VideoPlayer embedUrl={embedUrl} directVideo={isDirectVideo || embedUrl.includes("googlevideo.com")} onProgress={handleProgress} />}
            {streamSource && !isLoading && !streamSource.embedUrl && <div className="w-full aspect-video bg-black rounded-xl flex items-center justify-center"><div className="flex flex-col items-center gap-3 text-center px-4"><p className="text-sm text-white/60">Sumber video tidak ditemukan.</p></div></div>}
          </div>

          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-foreground">{displayTitle}</p></div></div>

          {streamSource?.qualities && streamSource.qualities.length > 0 && <MirrorSelector qualities={streamSource.qualities} onSelectMirror={handleMirrorChange} />}
          <DownloadSection downloadGroups={streamSource?.downloadGroups} malId={id} episode={ep} animeTitle={anime?.title} />
          <EpisodeComments malId={id} episodeNumber={ep} />
        </div>

        <div className="lg:w-72 shrink-0">
          <div className="sticky top-20"><EpisodeSidebar episodes={episodes} malId={id} currentEpisode={ep} /></div>
        </div>
      </div>
    </div>
  );
}
