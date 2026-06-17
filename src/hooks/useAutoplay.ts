"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";

export function useAutoplay({
  malId,
  currentEpisode,
  totalEpisodes,
  isPlaying,
}: {
  malId: number;
  currentEpisode: number;
  totalEpisodes: number;
  isPlaying: boolean;
}) {
  const autoplay = usePlayerStore((s) => s.autoplay);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const episodeRef = useRef(currentEpisode);

  useEffect(() => {
    episodeRef.current = currentEpisode;
  }, [currentEpisode]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    if (!autoplay || !isPlaying) return;
    if (currentEpisode >= totalEpisodes) return;

    const EPISODE_DURATION = 23 * 60 * 1000;
    const COUNTDOWN = 8 * 1000;

    timerRef.current = setTimeout(() => {
      if (episodeRef.current !== currentEpisode) return;
      const next = currentEpisode + 1;
      router.push(`/anime/${malId}/${next}`);
    }, EPISODE_DURATION - COUNTDOWN);

    return clearTimer;
  }, [autoplay, isPlaying, currentEpisode, malId, totalEpisodes, clearTimer, router]);
}
