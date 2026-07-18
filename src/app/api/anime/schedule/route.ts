import { NextResponse } from "next/server";
import { getSchedules } from "@/lib/jikan";
import { cacheAnimeData } from "@/lib/anime-cache";
import { filterNsfw } from "@/lib/nsfw";
import { db } from "@/lib/db";

function isNsfwRecord(a: Record<string, unknown>): boolean {
  const rating = ((a.rating as string) || "").toLowerCase();
  if (rating.includes("rx") || rating.includes("hentai")) return true;
  const explicit = a.explicit_genres as Array<{ name?: string }> | undefined;
  if (explicit && explicit.length > 0) return true;
  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day") || "thursday";

  // Try Jikan first
  try {
    const result = await getSchedules(day);

    // Keep only currently-airing anime. Jikan's schedule endpoint also
    // returns finished shows that still carry a broadcast.day, so filter
    // them out by status.
    result.data = filterNsfw(
      result.data.filter((a) => {
        const s = (a.status as string | undefined)?.toLowerCase() || "";
        return s === "currently airing";
      })
    );

    for (const anime of result.data) {
      cacheAnimeData(anime.mal_id, anime).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (e) {
    console.warn(`[api/anime/schedule] Jikan failed for ${day}:`, (e as Error).message);
  }

  // DB fallback
  try {
    const allCached = await db.cachedAnime.findMany({
      select: { data: true },
      orderBy: { updatedAt: "desc" },
    });

    const dayNorm = day.trim().toLowerCase();
    const results = allCached
      .map((c) => c.data as Record<string, unknown>)
      .filter((a) => !isNsfwRecord(a))
      .filter((a) => {
        const s = (a.status as string)?.toLowerCase() || "";
        if (s !== "currently airing") return false;
        const bDay = (a.broadcast as { day?: string | null } | undefined)?.day;
        if (!bDay) return false;
        return bDay.toLowerCase().replace(/s$/, "") === dayNorm;
      })
      .slice(0, 100);

    return NextResponse.json({
      data: results,
      pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: results.length, total: results.length, per_page: 100 } },
    });
  } catch (e) {
    console.error("[api/anime/schedule] DB fallback failed:", e);
    return NextResponse.json({ data: [], pagination: { last_visible_page: 0, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: 0 } } }, { status: 502 });
  }
}
