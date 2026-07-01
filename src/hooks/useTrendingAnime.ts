import { useQuery } from "@tanstack/react-query";
import type { Anime } from "@/types/anime";

export function useTrendingAnime() {
  return useQuery<Anime[]>({
    queryKey: ["trending-anime"],
    queryFn: () => fetch("/api/anime/home?type=trending").then((r) => r.json().then((d: { data: Anime[] }) => d.data)),
    staleTime: 10 * 60 * 1000,
  });
}
