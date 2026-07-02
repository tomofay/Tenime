import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { WatchHistory } from "@/types/user";

async function fetchHistory(): Promise<WatchHistory[]> {
  const res = await fetch("/api/user/history");
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export function useWatchHistory() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["watchHistory", session?.user?.id],
    queryFn: fetchHistory,
    staleTime: 30 * 1000,
    enabled: !!session?.user?.id,
  });
}
