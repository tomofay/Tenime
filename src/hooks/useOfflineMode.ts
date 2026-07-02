import { useQuery } from "@tanstack/react-query";

export function useOfflineMode() {
  return useQuery({
    queryKey: ["offline-status"],
    queryFn: async () => {
      try {
        const res = await fetch("https://api.jikan.moe/v4/anime/1", { signal: AbortSignal.timeout(3000) });
        return !res.ok;
      } catch {
        return true;
      }
    },
    staleTime: 30 * 1000,
    retry: 0,
  });
}
