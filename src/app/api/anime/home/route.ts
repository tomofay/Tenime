import { NextResponse } from "next/server";
import { getTopAnime, getSeasonNow } from "@/lib/jikan";
import { cacheAnimeData } from "@/lib/anime-cache";
import { filterNsfw } from "@/lib/nsfw";
import { toCardWithLocalPoster } from "@/lib/poster";
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

    const safe = filterNsfw(data);
    for (const anime of safe) cacheAnimeData(anime.mal_id, anime).catch(() => {});
    return NextResponse.json({ data: safe.map(toCardWithLocalPoster) });
  } catch (e) {
    // silent — DB fallback below
  }

  // DB fallback
  try {
    const allCached = await db.cachedAnime.findMany({
      select: { data: true },
      orderBy: { updatedAt: "desc" },
    });

    let results = allCached
      .map((c) => c.data as Record<string, unknown>)
      .filter((a) => !isNsfwRecord(a));
    if (type === "seasonal" || type === "trending") {
      results = results.filter((a) => ((a.status as string)?.toLowerCase() || "") === "currently airing");
    }
    results.sort((a, b) => ((b.score as number) || 0) - ((a.score as number) || 0));
    return NextResponse.json({ data: results.slice(0, 25).map(toCardWithLocalPoster) });
  } catch (e) {
    console.error("[api/anime/home] DB fallback failed:", e);
    return NextResponse.json({ data: [] }, { status: 502 });
  }
}

function isNsfwRecord(a: Record<string, unknown>): boolean {
  const rating = ((a.rating as string) || "").toLowerCase();
  if (rating.includes("rx") || rating.includes("hentai")) return true;
  const explicit = a.explicit_genres as Array<{ name?: string }> | undefined;
  if (explicit && explicit.length > 0) return true;
  return false;
}
