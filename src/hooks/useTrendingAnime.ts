import { useQuery } from "@tanstack/react-query";
import { getTopAnime } from "@/lib/jikan";

export function useTrendingAnime() {
  return useQuery({
    queryKey: ["trending-anime"],
    queryFn: () => getTopAnime("airing", 12),
    staleTime: 5 * 60 * 1000,
  });
}
