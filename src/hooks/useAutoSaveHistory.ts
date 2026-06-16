import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export function useAutoSaveHistory(
  malId: number,
  episodeNumber: number,
  animeTitle: string,
  posterUrl?: string,
  episodeTitle?: string
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
}
