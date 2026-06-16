"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnimeCharacters } from "@/lib/jikan";
import type { AnimeCharacterSimple } from "@/types/anime";

export function useAnimeCharacters(malId: number) {
  return useQuery<AnimeCharacterSimple[]>({
    queryKey: ["anime-characters", malId],
    queryFn: () => getAnimeCharacters(malId),
    staleTime: 30 * 60 * 1000,
    enabled: !!malId,
  });
}
