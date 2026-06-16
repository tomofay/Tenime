"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Bookmark } from "@/types/user";

interface BookmarkGridProps {
  bookmarks: Bookmark[];
}

export function BookmarkGrid({ bookmarks }: BookmarkGridProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">Watchlist kamu masih kosong.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {bookmarks.map((bookmark) => (
        <Link
          key={bookmark.id}
          href={`/anime/${bookmark.malId}`}
          className="group block"
        >
          <div className="relative overflow-hidden rounded-lg bg-surface aspect-[2/3]">
            {bookmark.posterUrl && (
              <Image
                src={bookmark.posterUrl}
                alt={bookmark.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              />
            )}
            {bookmark.score && (
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {bookmark.score.toFixed(1)}
              </div>
            )}
          </div>
          <h3 className="mt-2 text-sm font-medium text-foreground line-clamp-2 leading-tight group-hover:text-accent-hover transition-colors">
            {bookmark.title}
          </h3>
          {bookmark.type && (
            <span className="text-xs text-muted">{bookmark.type}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
