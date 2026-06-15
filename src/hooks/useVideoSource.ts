"use client";

import { useQuery } from "@tanstack/react-query";
import type { StreamSource } from "@/types/stream";

export function useVideoSource(
  malId: number,
  episode: number,
  title?: string
) {
  return useQuery<StreamSource>({
    queryKey: ["video-source", malId, episode],
    queryFn: async () => {
      const params = new URLSearchParams({
        malId: String(malId),
        ep: String(episode),
      });
      if (title) params.set("title", title);
      const res = await fetch(`/api/stream?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        return data as StreamSource;
      }
      return res.json();
    },
    staleTime: 30 * 1000,
    enabled: !!malId && episode > 0,
    retry: 2,
  });
}
