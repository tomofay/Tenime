import { useQuery } from "@tanstack/react-query";
import type { Anime } from "@/types/anime";

interface CachedAnimeResponse {
  data: Anime;
  cached: boolean;
  stale?: boolean;
  downloadStatus: { downloaded: boolean; quality?: string; filePath?: string };
}

export function useAnimeDetail(malId: number) {
  return useQuery<CachedAnimeResponse>({
    queryKey: ["anime-detail", malId],
    queryFn: async () => {
      const res = await fetch(`/api/anime/${malId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!malId,
  });
}
