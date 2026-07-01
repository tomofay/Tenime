import { useQuery } from "@tanstack/react-query";
import type { Episode } from "@/types/anime";

interface PagedEpisodes {
  data: Episode[];
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: { count: number; total: number; per_page: number };
  };
}

export function useAnimeEpisodes(malId: number) {
  return useQuery<PagedEpisodes, Error, PagedEpisodes>({
    queryKey: ["anime-episodes", malId],
    queryFn: () => fetch(`/api/anime/${malId}/episodes`).then((r) => r.json()),
    staleTime: 30 * 60 * 1000,
    enabled: !!malId,
  });
}
