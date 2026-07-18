import { NextResponse } from "next/server";
import { getAnimeFull } from "@/lib/jikan";
import { cacheAnimeData } from "@/lib/anime-cache";
import { db } from "@/lib/db";
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

        results[String(malId)] = {
          title: anime.title,
          episodes: anime.episodes,
          score: anime.score,
          status: anime.status,
          type: anime.type,
          year: anime.year,
          poster: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || null,
        };
      } catch {
        try {
          const cached = await db.cachedAnime.findUnique({ where: { malId }, select: { data: true } });
          if (cached) {
            const a = cached.data as Record<string, unknown>;
            const images = a.images as { webp?: { large_image_url: string }; jpg?: { large_image_url: string } } | undefined;
            results[String(malId)] = {
              title: a.title,
              episodes: a.episodes,
              score: a.score,
              status: a.status,
              type: a.type,
              year: a.year,
              poster: images?.webp?.large_image_url || images?.jpg?.large_image_url || null,
            };
            continue;
          }
        } catch { /* ignore DB fallback */ }
        results[String(malId)] = { error: "failed" };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
