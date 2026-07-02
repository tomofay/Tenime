"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Calendar, CheckCircle2 } from "lucide-react";
import type { Anime } from "@/types/anime";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

interface DetailHeroProps {
  anime: Anime;
  isCached?: boolean;
  isStale?: boolean;
}

export function DetailHero({ anime, isCached, isStale }: DetailHeroProps) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const synopsisText = anime.synopsis ?? "";
  const isLongSynopsis = synopsisText.length > 300;
  const displaySynopsis = isLongSynopsis && !synopsisExpanded ? synopsisText.slice(0, 300).trimEnd() + "..." : synopsisText;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src={anime.images.webp.large_image_url} alt="" fill className="object-cover blur-2xl scale-110 opacity-20" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
          <div className="shrink-0 mx-auto sm:mx-0 w-40 sm:w-56 rounded-lg overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 relative aspect-[2/3]">
            <Image src={anime.images.webp.large_image_url} alt={anime.title} fill sizes="(max-width: 640px) 160px, 224px" className="object-cover" priority />
          </div>

          <div className="flex flex-col min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">{anime.title}</h1>
            {anime.title_english && anime.title_english !== anime.title && <p className="mt-1 text-sm text-muted">{anime.title_english}</p>}
            {anime.title_japanese && <p className="text-xs text-muted/60 mt-0.5">{anime.title_japanese}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {anime.score && <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1 text-accent font-semibold"><Star className="h-4 w-4 fill-accent" />{anime.score.toFixed(1)}</span>}
              {anime.rank && <span className="text-xs text-muted">Rank #{anime.rank}</span>}
              {anime.popularity && <span className="text-xs text-muted">Popularity #{anime.popularity}</span>}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {anime.type && <span>{anime.type}</span>}
              {anime.episodes && <span>{anime.episodes} Episodes</span>}
              {anime.duration && <span>{anime.duration}</span>}
              {anime.status && <span>{anime.status}</span>}
              {anime.rating && <span>{anime.rating}</span>}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {anime.studios?.length > 0 && <span>{anime.studios.map((s) => s.name).join(", ")}</span>}
              {anime.season && anime.year && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} {anime.year}</span>}
              {anime.broadcast?.day && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{anime.broadcast.day}{anime.broadcast.time ? ` at ${anime.broadcast.time}` : ""}</span>}
            </div>

            {anime.genres?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {anime.genres.map((genre) => (
                  <Link key={genre.mal_id} href={`/browse?genres=${genre.mal_id}`} className="rounded-full border border-border px-3 py-0.5 text-xs text-muted hover:text-foreground hover:border-accent/50 transition-colors">{genre.name}</Link>
                ))}
              </div>
            )}

            {/* Action row: Watchlist + Status badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <BookmarkButton malId={anime.mal_id} title={anime.title} posterUrl={anime.images?.webp?.large_image_url} score={anime.score ?? undefined} type={anime.type} status={anime.status?.toLowerCase().includes("complete") ? "completed" : "ongoing"} size="sm" />
              {isCached && <span className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs text-green-400"><CheckCircle2 className="h-3 w-3" />Tersimpan offline</span>}
              {isStale && <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Data lama</span>}
            </div>

            {synopsisText && (
              <div className="mt-4">
                <p className="text-sm text-muted leading-relaxed">{displaySynopsis}</p>
                {isLongSynopsis && <button onClick={() => setSynopsisExpanded(!synopsisExpanded)} className="mt-1 text-xs text-accent hover:text-accent-hover transition-colors">{synopsisExpanded ? "Show less" : "Show more"}</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
