"use client";

import Image from "next/image";
import { useAnimeCharacters } from "@/hooks/useAnimeCharacters";
import type { AnimeCharacterSimple } from "@/types/anime";

interface CharactersTabProps {
  malId: number;
}

export function CharactersTab({ malId }: CharactersTabProps) {
  const { data, isLoading, isError } = useAnimeCharacters(malId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="py-12 text-center"><p className="text-sm text-muted">Gagal memuat karakter.</p></div>;
  }

  const unique = data.filter((c, i, arr) => arr.findIndex((x) => x.mal_id === c.mal_id) === i);

  if (unique.length === 0) {
    return <div className="py-12 text-center"><p className="text-sm text-muted">Tidak ada data karakter.</p></div>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {unique.map((character, i) => (
          <div key={`${character.mal_id}-${i}`} className="group cursor-pointer">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface mb-2">
              {character.image_url ? (
                <Image
                  src={character.image_url}
                  alt={character.name}
                  fill
                  sizes="140px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-xs">No Image</div>
              )}
              <div className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white font-medium">
                {character.role}
              </div>
            </div>
            <p className="text-xs font-medium text-foreground leading-tight line-clamp-2 text-center">
              {character.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

