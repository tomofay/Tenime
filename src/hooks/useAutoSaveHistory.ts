import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

interface ProgressUpdate {
  seconds: number;
  percent: number;
  duration: number;
}

export function useAutoSaveHistory(
  malId: number,
  episodeNumber: number,
  animeTitle: string,
  posterUrl?: string,
  episodeTitle?: string,
  onProgress?: (p: ProgressUpdate) => void
) {
  const { data: session } = useSession();
  const savedRef = useRef<string>("");

  useEffect(() => {
    if (!session || !animeTitle || episodeNumber < 1) return;
    const key = `${malId}:${episodeNumber}`;
    if (savedRef.current === key) return;
    savedRef.current = key;

    fetch("/api/user/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        malId,
        animeTitle,
        posterUrl: posterUrl || null,
        episodeNumber,
        episodeTitle: episodeTitle || null,
      }),
    }).catch(() => {});
  }, [malId, episodeNumber, animeTitle, posterUrl, episodeTitle, session]);

  // Persist the actual watched position (throttled by the caller)
  useEffect(() => {
    if (!onProgress) return;
    const handler = (p: ProgressUpdate) => {
      if (!session || !animeTitle || episodeNumber < 1) return;
      if (p.duration <= 0) return;
      fetch("/api/user/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          malId,
          animeTitle,
          posterUrl: posterUrl || null,
          episodeNumber,
          episodeTitle: episodeTitle || null,
          progressSeconds: p.seconds,
          progressPercent: Math.round(p.percent),
        }),
      }).catch(() => {});
    };
    onProgressRef.current = handler;
    return () => { onProgressRef.current = null; };
  }, [onProgress, session, animeTitle, episodeNumber, posterUrl, episodeTitle]);

  const onProgressRef = useRef<((p: ProgressUpdate) => void) | null>(null);
  return { reportProgress: (p: ProgressUpdate) => onProgressRef.current?.(p) };
}
