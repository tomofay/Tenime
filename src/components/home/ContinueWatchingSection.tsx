"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Clock } from "lucide-react";
import type { ContinueWatchingEntry } from "@/hooks/useContinueWatching";
import { Section } from "@/components/home/Section";

interface ContinueWatchingSectionProps {
  entries: ContinueWatchingEntry[];
}

export function ContinueWatchingSection({ entries }: ContinueWatchingSectionProps) {
  if (!entries.length) return null;

  return (
    <Section title="Lanjutkan Nonton" variant="horizontal">
      {entries.slice(0, 12).map((entry) => (
        <Link
          key={entry.malId}
          href={`/anime/${entry.malId}/${entry.episodeNumber}`}
          className="group shrink-0 w-[calc((100vw-2rem-16px)/3)] sm:w-40 lg:w-44"
        >
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface">
            {entry.posterUrl ? (
              <Image
                src={entry.posterUrl}
                alt={entry.title}
                fill
                sizes="(max-width: 640px) 110px, 176px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted">
                <Play className="h-8 w-8" />
              </div>
            )}
            {entry.totalEpisodes && entry.totalEpisodes > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, (entry.episodeNumber / entry.totalEpisodes) * 100)}%` }}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
            </div>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-foreground truncate">
            {entry.title}
          </p>
          <p className="text-[10px] sm:text-xs text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Ep {entry.episodeNumber}
            {entry.totalEpisodes && ` / ${entry.totalEpisodes}`}
          </p>
        </Link>
      ))}
    </Section>
  );
}
