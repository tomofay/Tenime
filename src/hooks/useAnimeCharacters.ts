"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnimeCharacterSimple } from "@/types/anime";

export function useAnimeCharacters(malId: number) {
  return useQuery<AnimeCharacterSimple[]>({
    queryKey: ["anime-characters", malId],
    queryFn: () => fetch(`/api/anime/${malId}/characters`).then((r) => r.json().then((d: { data: AnimeCharacterSimple[] }) => d.data)),
    staleTime: 60 * 60 * 1000,
    enabled: !!malId,
  });
}
