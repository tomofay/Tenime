import { NextResponse } from "next/server";
import { getAnimeFull } from "@/lib/jikan";
import { db } from "@/lib/db";
import { cacheAnimeData } from "@/lib/anime-cache";
import { cacheAnimeSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/api-utils";

const CACHE_LIMIT = { windowMs: 60_000, maxRequests: 10 };

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, CACHE_LIMIT);
  if (rateLimit) return rateLimit;
  try {
    const body = await request.json();
    const parsed = cacheAnimeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "malIds must be an array of positive integers (max 25)" }, { status: 400 });
    }

    const { malIds } = parsed.data;
    const results: Record<string, unknown> = {};

    for (const malId of malIds) {
      try {
        const anime = await getAnimeFull(malId);
        await cacheAnimeData(malId, anime);

        const download = await db.downloadedFile.findFirst({
          where: { malId }, orderBy: { createdAt: "desc" },
        });

        results[String(malId)] = {
          title: anime.title,
          episodes: anime.episodes,
          score: anime.score,
          status: anime.status,
          type: anime.type,
          year: anime.year,
          poster: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || null,
          downloaded: !!download,
        };
      } catch {
        results[String(malId)] = { error: "failed" };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
