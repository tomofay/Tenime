import { NextResponse } from "next/server";
import { getTopAnime, getSeasonNow } from "@/lib/jikan";
import { cacheAnimeData } from "@/lib/anime-cache";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "trending";

  // Try Jikan with 4s timeout — if rate-limited or slow, immediate DB fallback
  try {
    const p = type === "popular" ? getTopAnime("bypopularity")
      : type === "seasonal" ? getSeasonNow()
      : getTopAnime("airing");

    const data = await Promise.race([
      p,
      new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), 4000)),
    ]);

    for (const anime of data) cacheAnimeData(anime.mal_id, anime).catch(() => {});
    return NextResponse.json({ data });
  } catch (e) {
    // silent — DB fallback below
  }

  // DB fallback
  try {
    const allCached = await db.cachedAnime.findMany({
      select: { data: true },
      orderBy: { updatedAt: "desc" },
    });

    let results = allCached.map((c) => c.data as Record<string, unknown>);
    if (type === "seasonal" || type === "trending") {
      results = results.filter((a) => ((a.status as string)?.toLowerCase() || "") === "currently airing");
    }
    results.sort((a, b) => ((b.score as number) || 0) - ((a.score as number) || 0));
    return NextResponse.json({ data: results.slice(0, 25) });
  } catch (e) {
    console.error("[api/anime/home] DB fallback failed:", e);
    return NextResponse.json({ data: [] }, { status: 502 });
  }
}
