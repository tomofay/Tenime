import { useQuery } from "@tanstack/react-query";
import { getAnimeEpisodes } from "@/lib/jikan";
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
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const result = await getAnimeEpisodes(malId);
        clearTimeout(timeout);
        return result;
      } catch {
        // Fallback to local episodes from downloaded files
        const res = await fetch(`/api/anime/${malId}/episodes-local`);
        if (!res.ok) throw new Error("No episodes available");
        const json = await res.json();
        return {
          data: json.data as Episode[],
          pagination: {
            last_visible_page: 1,
            has_next_page: false,
            current_page: 1,
            items: { count: json.data.length, total: json.data.length, per_page: json.data.length },
          },
        };
      }
    },
    staleTime: 30 * 1000,
    enabled: !!malId,
  });
}
