import { useQuery } from "@tanstack/react-query";
import type { WatchHistory } from "@/types/user";

async function fetchHistory(): Promise<WatchHistory[]> {
  const res = await fetch("/api/user/history");
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export function useWatchHistory() {
  return useQuery({
    queryKey: ["watchHistory"],
    queryFn: fetchHistory,
    staleTime: 30 * 1000,
  });
}
