import { useQuery } from "@tanstack/react-query";

interface ContinueWatchingEntry {
  malId: number;
  title: string;
  posterUrl: string | null;
  episodeNumber: number;
  episodeTitle: string | null;
  totalEpisodes: number | null;
  watchedAt: string;
}

async function fetchContinueWatching(): Promise<ContinueWatchingEntry[]> {
  const res = await fetch("/api/user/continue-watching");
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export function useContinueWatching() {
  return useQuery({
    queryKey: ["continue-watching"],
    queryFn: fetchContinueWatching,
    staleTime: 30 * 1000,
  });
}

export type { ContinueWatchingEntry };
