import { useQuery } from "@tanstack/react-query";
import { getTopAnime } from "@/lib/jikan";

export function usePopularAnime() {
  return useQuery({
    queryKey: ["popular-anime"],
    queryFn: () => getTopAnime("bypopularity", 12),
    staleTime: 5 * 60 * 1000,
  });
}
