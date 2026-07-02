import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["continue-watching", session?.user?.id],
    queryFn: fetchContinueWatching,
    staleTime: 30 * 1000,
    enabled: !!session?.user?.id,
  });
}

export type { ContinueWatchingEntry };
