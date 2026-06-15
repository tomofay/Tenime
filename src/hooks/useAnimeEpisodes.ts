import { useQuery } from "@tanstack/react-query";
import { getAnimeEpisodes } from "@/lib/jikan";

export function useAnimeEpisodes(malId: number) {
  return useQuery({
    queryKey: ["anime-episodes", malId],
    queryFn: () => getAnimeEpisodes(malId),
    staleTime: 60 * 1000,
    enabled: !!malId,
  });
}
