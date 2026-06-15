import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Anime } from "@/types/anime";

interface AnimeCardProps {
  anime: Anime;
  size?: "sm" | "md";
}

export function AnimeCard({ anime, size = "md" }: AnimeCardProps) {
  const posterSize = size === "sm" ? 160 : 200;

  return (
    <Link
      href={`/anime/${anime.mal_id}`}
      className="group block shrink-0"
    >
      <div
        className="relative overflow-hidden rounded-lg bg-surface"
        style={{ width: posterSize, aspectRatio: "2/3" }}
      >
        <Image
          src={anime.images.webp.large_image_url}
          alt={anime.title}
          fill
          sizes={`${posterSize}px`}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Score badge */}
        {anime.score && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {anime.score.toFixed(1)}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <p className="text-xs text-white font-medium leading-tight line-clamp-3">
            {anime.synopsis}
          </p>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-2 text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover:text-accent-hover transition-colors">
        {anime.title}
      </h3>

      {/* Meta */}
      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
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
