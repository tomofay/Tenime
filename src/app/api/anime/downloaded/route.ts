import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const downloaded = await db.downloadedFile.findMany({
      select: { malId: true, animeTitle: true, episodeNumber: true, quality: true, sizeBytes: true },
      orderBy: { malId: "asc" },
    });

    // Group by malId
    const grouped = new Map<number, {
      malId: number;
      title: string;
      episodes: Set<number>;
      qualities: Set<string>;
      totalSizeBytes: number;
    }>();

    for (const d of downloaded) {
      let entry = grouped.get(d.malId);
      if (!entry) {
        entry = { malId: d.malId, title: d.animeTitle, episodes: new Set(), qualities: new Set(), totalSizeBytes: 0 };
        grouped.set(d.malId, entry);
      }
      entry.episodes.add(d.episodeNumber);
      entry.qualities.add(d.quality);
      const size = typeof d.sizeBytes === "bigint" ? Number(d.sizeBytes) : (d.sizeBytes ? Number(d.sizeBytes) : 0);
      entry.totalSizeBytes += size;
    }

    // Enrich with cached anime data for poster/score
    const malIds = [...grouped.keys()];
    const cached = await db.cachedAnime.findMany({
      where: { malId: { in: malIds } },
      select: { malId: true, data: true },
    });
    const cacheMap = new Map(cached.map((c) => [c.malId, c.data as Record<string, unknown>]));

    const results = [...grouped.values()].map((entry) => {
      const data = cacheMap.get(entry.malId);
      const eps = [...entry.episodes].sort((a, b) => a - b);
      return {
        malId: entry.malId,
        title: data?.title || entry.title,
        poster: data?.images
          ? (data.images as { webp?: { large_image_url: string } }).webp?.large_image_url ?? null
          : null,
        score: data?.score ?? null,
        type: data?.type ?? null,
        episodes: eps,
        episodeCount: eps.length,
        maxEpisode: eps[eps.length - 1] || 0,
        qualities: [...entry.qualities],
        // totalSizeFormatted: formatBytes(totalSizeBytes),
      };
    });

    return NextResponse.json({ count: results.length, results });
  } catch (e) {
    console.error("/api/anime/downloaded", e);
    return NextResponse.json({ count: 0, results: [] });
  }
}
