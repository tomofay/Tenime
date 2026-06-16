"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Play, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import type { Anime } from "@/types/anime";

interface HeroCarouselProps {
  animeList: Anime[];
}

function getYoutubeId(anime: Anime): string | null {
  const id = anime.trailer?.youtube_id;
  if (id) return id;
  const embed = anime.trailer?.embed_url;
  if (!embed) return null;
  const m = embed.match(/(?:\/embed\/|\.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function HeroCarousel({ animeList }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [origin, setOrigin] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = animeList.length;

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setVideoReady(false);
  }, []);

  const next = useCallback(() => goTo((current + 1) % count), [current, count, goTo]);
  const prev = useCallback(() => goTo((current - 1 + count) % count), [current, count, goTo]);

  useEffect(() => {
    if (count <= 1) return;
    intervalRef.current = setInterval(next, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [next, count]);

  const onManualNav = useCallback((fn: () => void) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    fn();
    intervalRef.current = setInterval(next, 30000);
  }, [next]);

  const anime = animeList[current];
  if (!anime) return null;

  const youtubeId = getYoutubeId(anime);
  const hasTrailer = !!youtubeId;

  return (
    <div
      className="relative w-full h-[85vh] sm:h-[90vh] max-h-[800px] overflow-hidden bg-black"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {hasTrailer && (
          <div className="absolute top-1/2 left-1/2 w-[130%] h-[130%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <iframe
              key={`yt-${current}`}
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&disablekb=1&loop=1&playlist=${youtubeId}&rel=0&iv_load_policy=3&modestbranding=1&fs=0&playsinline=1&cc_load_policy=0&origin=${encodeURIComponent(origin)}`}
              className="w-full h-full border-none pointer-events-none select-none"
              style={{ pointerEvents: "none" }}
              allow="autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              title=""
              onLoad={() => setVideoReady(true)}
            />
          </div>
        )}
        <Image
          src={anime.images.webp.large_image_url}
          alt=""
          fill
          className={`object-cover transition-opacity duration-700 ${videoReady ? "opacity-0" : "opacity-100"}`}
          priority
          loading="eager"
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${isHovered ? "bg-black/40 backdrop-blur-[2px]" : "bg-black/0"}`} />

      {/* Sound toggle */}
      {hasTrailer && (
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-24 right-6 z-20 rounded-full bg-black/50 backdrop-blur-sm p-3 text-white/80 hover:bg-black/80 hover:text-white border border-white/10 transition-colors"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className={`transition-all duration-500 ${isHovered ? "translate-y-0 opacity-100" : "translate-y-6 opacity-90"}`}>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-2xl">{anime.title}</h1>
            {anime.title_english && anime.title_english !== anime.title && <p className="mt-2 text-sm text-white/60">{anime.title_english}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm pointer-events-auto">
              {anime.score && <span className="inline-flex items-center gap-1 rounded bg-white/10 backdrop-blur-sm px-2.5 py-1 text-white font-semibold"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{anime.score.toFixed(1)}</span>}
              {anime.type && <span className="text-white/60 border border-white/20 rounded px-2 py-0.5 text-xs">{anime.type}</span>}
              {anime.status && <span className="text-white/60 border border-white/20 rounded px-2 py-0.5 text-xs">{anime.status}</span>}
              {anime.season && anime.year && <span className="text-white/60 border border-white/20 rounded px-2 py-0.5 text-xs capitalize">{anime.season} {anime.year}</span>}
            </div>
            {anime.synopsis && <p className="mt-4 text-sm text-white/70 leading-relaxed line-clamp-3 max-w-2xl">{anime.synopsis}</p>}
            <div className="mt-6 flex items-center gap-3 pointer-events-auto">
              <Link href={`/anime/${anime.mal_id}`} className="inline-flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white/90 transition-colors"><Play className="h-4 w-4 fill-black" />Tonton</Link>
              <Link href={`/anime/${anime.mal_id}`} className="inline-flex items-center gap-2 rounded bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-bold text-white hover:bg-white/20 border border-white/10 transition-colors">Detail</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className={`transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {count > 1 && (
          <div className="absolute right-6 bottom-36 flex items-center gap-2 z-20">
            <button onClick={() => onManualNav(prev)} className="rounded-full bg-black/50 backdrop-blur-sm p-2.5 text-white hover:bg-black/70 border border-white/10 transition-colors" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => onManualNav(next)} className="rounded-full bg-black/50 backdrop-blur-sm p-2.5 text-white hover:bg-black/70 border border-white/10 transition-colors" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
          </div>
        )}
        {count > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {animeList.map((a, i) => (
              <button key={a.mal_id} onClick={() => onManualNav(() => goTo(i))} className={`rounded-full transition-all duration-300 ${i === current ? "w-8 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/50"}`} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
