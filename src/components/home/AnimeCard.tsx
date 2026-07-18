"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Sparkles, Trophy } from "lucide-react";

interface AnimeCardProps {
  anime: {
    mal_id: number;
    title: string;
    images: { webp: { large_image_url: string } };
    score?: number | null;
    episodes?: number | null;
    type?: string;
    airing?: boolean;
    synopsis?: string | null;
  };
  size?: "sm" | "md";
  rank?: number;
  index?: number;
}

export function AnimeCard({ anime, size = "md", rank, index = 0 }: AnimeCardProps) {
  const showRank = typeof rank === "number" && rank <= 10;
  return (
    <Link
      href={`/anime/${anime.mal_id}`}
      className="group block w-full motion-safe:animate-card-in"
      style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}
    >
      <div
        className="relative overflow-hidden rounded-xl bg-surface w-full shadow-sm ring-1 ring-black/5 group-hover:ring-accent/40 group-hover:shadow-xl group-hover:shadow-black/30 transition-all duration-300"
        style={{ aspectRatio: "2/3" }}
      >
        <Image
          src={anime.images.webp.large_image_url}
          alt={anime.title}
          fill
          sizes="(max-width: 640px) 140px, (max-width: 768px) 160px, 200px"
          className="object-cover scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />

        {anime.score && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-medium text-white">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {anime.score.toFixed(1)}
          </div>
        )}

        {showRank && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-accent px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-white shadow-sm">
            <Trophy className="h-2.5 w-2.5 fill-white" />
            {rank}
          </div>
        )}

        {anime.airing && !showRank && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded bg-accent/90 px-1 sm:px-1.5 py-0.5 text-[10px] text-white font-medium">
            <Sparkles className="h-2.5 w-2.5" />
            NEW
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 hidden sm:flex flex-col gap-1 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-xs text-white font-medium leading-tight line-clamp-3 drop-shadow">
            {anime.synopsis}
          </p>
        </div>
      </div>

      <h3 className="mt-1.5 text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-accent-hover transition-colors min-h-[2rem]">
        {anime.title}
      </h3>

      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] sm:text-xs text-muted min-h-[0.75rem]">
        <span>{anime.type || "TV"}</span>
        {anime.episodes && (
          <>
            <span className="text-border">•</span>
            <span>{anime.episodes} eps</span>
          </>
        )}
      </div>
    </Link>
  );
}
