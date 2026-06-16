import { useQuery } from "@tanstack/react-query";
import { getSeasonNow } from "@/lib/jikan";

export function useSeasonalAnime() {
  return useQuery({
    queryKey: ["seasonal-anime"],
    queryFn: () => getSeasonNow(12),
    staleTime: 5 * 60 * 1000,
  });
}
