"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Play } from "lucide-react";
import type { Anime } from "@/types/anime";

interface HeroBannerProps {
  anime: Anime;
}

export function HeroBanner({ anime }: HeroBannerProps) {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background blur */}
      <div className="absolute inset-0">
        <Image
          src={anime.images.webp.large_image_url}
          alt=""
          fill
          className="object-cover blur-2xl scale-110 opacity-30"
          priority
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 flex flex-col sm:flex-row items-center gap-8">
        {/* Poster */}
        <div className="shrink-0 w-48 sm:w-56 rounded-lg overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10 relative aspect-[2/3]">
          <Image
            src={anime.images.webp.large_image_url}
            alt={anime.title}
            fill
            sizes="(max-width: 640px) 192px, 224px"
            className="object-cover"
            priority
          />
        </div>

        {/* Info */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
            {anime.title}
          </h1>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="mt-1 text-sm text-muted">{anime.title_english}</p>
          )}

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted">
            {anime.score && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent">
                <Star className="h-3 w-3 fill-accent" />
                {anime.score.toFixed(1)}
              </span>
            )}
            {anime.type && (
              <span className="rounded-md bg-surface px-2 py-0.5">
                {anime.type}
              </span>
            )}
            {anime.episodes && (
              <span className="rounded-md bg-surface px-2 py-0.5">
                {anime.episodes} eps
              </span>
            )}
            {anime.status && (
              <span className="rounded-md bg-surface px-2 py-0.5">
                {anime.status}
              </span>
            )}
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {anime.genres.slice(0, 4).map((genre) => (
                <Link
                  key={genre.mal_id}
                  href={`/browse?genres=${genre.mal_id}`}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted hover:text-foreground hover:border-accent/50 transition-colors"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {anime.synopsis && (
            <p className="mt-4 text-sm text-muted leading-relaxed line-clamp-3 max-w-lg">
              {anime.synopsis}
            </p>
          )}

          {/* CTA */}
          <Link
            href={`/anime/${anime.mal_id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-colors shadow-lg shadow-accent/25"
          >
            <Play className="h-4 w-4 fill-white" />
            Tonton Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
