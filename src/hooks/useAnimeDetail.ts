import { useQuery } from "@tanstack/react-query";
import type { Anime } from "@/types/anime";

interface CachedAnimeResponse {
  data: Anime;
  cached: boolean;
  stale?: boolean;
}

export function useAnimeDetail(
  malId: number,
  initialData?: { data: Anime; cached: boolean }
) {
  return useQuery<CachedAnimeResponse>({
    queryKey: ["anime-detail", malId],
    queryFn: async () => {
      const res = await fetch(`/api/anime/${malId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    initialData: initialData ? { data: initialData.data, cached: initialData.cached } : undefined,
    staleTime: 10 * 60 * 1000,
    enabled: !!malId,
  });
}
