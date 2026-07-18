import { NextResponse } from "next/server";
import { getAnimeFull } from "@/lib/jikan";
import { db } from "@/lib/db";
import { cacheAnimeData } from "@/lib/anime-cache";
import { withRateLimit } from "@/lib/api-utils";
import { isNsfw } from "@/lib/nsfw";
import { toCardWithLocalPoster } from "@/lib/poster";

const ANIME_LIMIT = { windowMs: 60_000, maxRequests: 60 };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ malId: string }> }
) {
  const rateLimit = withRateLimit(request, ANIME_LIMIT);
  if (rateLimit) return rateLimit;
  const { malId } = await params;
  const id = Number(malId);

  try {
    // 1. Check DB cache first (permanent)
    const cached = await db.cachedAnime.findUnique({ where: { malId: id } });
    if (cached) {
      if (isNsfw(cached.data as never)) {
        return NextResponse.json({ error: "Not available" }, { status: 404 });
      }
      return NextResponse.json({
        data: cached.data,
        cached: true,
      });
    }

    // 2. No cache — fetch from Jikan
    const anime = await getAnimeFull(id);
    if (isNsfw(anime)) {
      return NextResponse.json({ error: "Not available" }, { status: 404 });
    }

    // 3. Cache to DB
    await cacheAnimeData(id, anime);

    return NextResponse.json({
      data: toCardWithLocalPoster(anime as never),
      cached: false,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
