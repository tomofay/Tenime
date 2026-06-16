import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ results: [] });
  }

  const history = await db.watchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
    take: 50,
  });

  // Deduplicate by malId — keep only the most recent entry per anime
  const deduped = new Map<number, typeof history[0]>();
  for (const entry of history) {
    if (!deduped.has(entry.malId)) {
      deduped.set(entry.malId, entry);
    }
  }

  // Enrich with total episodes from cached anime data
  const malIds = [...deduped.keys()];
  const cached = await db.cachedAnime.findMany({
    where: { malId: { in: malIds } },
    select: { malId: true, data: true },
  });
  const episodesMap = new Map<number, number>();
  for (const c of cached) {
    const data = c.data as Record<string, unknown>;
    const eps = data.episodes as number | null;
    if (eps) episodesMap.set(c.malId, eps);
  }

  const results = [...deduped.entries()].map(([malId, entry]) => ({
    malId,
    title: entry.animeTitle,
    posterUrl: entry.posterUrl,
    episodeNumber: entry.episodeNumber,
    episodeTitle: entry.episodeTitle,
    totalEpisodes: episodesMap.get(malId) ?? null,
    watchedAt: entry.watchedAt,
  }));

  return NextResponse.json({ results });
}
