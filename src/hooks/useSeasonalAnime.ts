import { useQuery } from "@tanstack/react-query";
import type { Anime } from "@/types/anime";

export function useSeasonalAnime() {
  return useQuery<Anime[]>({
    queryKey: ["seasonal-anime"],
    queryFn: () => fetch("/api/anime/home?type=seasonal").then((r) => r.json().then((d: { data: Anime[] }) => d.data)),
    staleTime: 10 * 60 * 1000,
  });
}
