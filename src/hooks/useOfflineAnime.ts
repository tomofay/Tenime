import { useQuery } from "@tanstack/react-query";

export function useOfflineAnimeList() {
  return useQuery({
    queryKey: ["offline-anime-list"],
    queryFn: async () => {
      const res = await fetch("/api/anime/list");
      if (!res.ok) throw new Error("Offline list unavailable");
      return res.json() as Promise<{
        count: number;
        results: {
          malId: number;
          title: string;
          episodes: number | null;
          score: number | null;
          status: string;
          type: string;
          year: number | null;
          poster: string | null;
          updatedAt: string;
          downloaded: boolean;
        }[];
      }>;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useOfflineMode() {
  return useQuery({
    queryKey: ["offline-mode-check"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch("https://api.jikan.moe/v4", { signal: controller.signal });
        clearTimeout(timeout);
        return false;
      } catch {
        return true;
      }
    },
    staleTime: 30 * 1000,
    retry: 0,
  });
}
