import { useQuery } from "@tanstack/react-query";
import type { Anime } from "@/types/anime";

export function usePopularAnime() {
  return useQuery<Anime[]>({
    queryKey: ["popular-anime"],
    queryFn: () => fetch("/api/anime/home?type=popular").then((r) => r.json().then((d: { data: Anime[] }) => d.data)),
    staleTime: 10 * 60 * 1000,
  });
}
