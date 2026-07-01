import { NextResponse } from "next/server";
import { getAnimeEpisodes } from "@/lib/jikan";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;
  const id = Number(malId);

  try {
    const result = await getAnimeEpisodes(id);
    return NextResponse.json(result);
  } catch (e) {
    console.warn(`[api/anime/${id}/episodes] Jikan failed:`, (e as Error).message);
  }

  // DB fallback: episodes from CachedAnime
  try {
    const cached = await db.cachedAnime.findUnique({ where: { malId: id } });
    if (cached) {
      const data = cached.data as Record<string, unknown>;
      const eps = (data.episodes ?? 0) as number;
      if (eps > 0) {
        const episodes = Array.from({ length: eps }, (_, i) => ({
          mal_id: id,
          title: `Episode ${i + 1}`,
          episode: String(i + 1),
          url: null,
          score: null,
          filler: false,
          recap: false,
        }));
        return NextResponse.json({
          data: episodes,
          pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: eps, total: eps, per_page: eps } },
        });
      }
    }

    // Fallback to downloaded episodes
    const files = await db.downloadedFile.findMany({
      where: { malId: id },
      select: { episodeNumber: true },
      orderBy: { episodeNumber: "asc" },
    });
    const eps = [...new Set(files.map((f) => f.episodeNumber))];
    const episodes = eps.map((ep) => ({
      mal_id: id,
      title: `Episode ${ep}`,
      episode: String(ep),
      url: null,
      score: null,
      filler: false,
      recap: false,
    }));
    return NextResponse.json({
      data: episodes,
      pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: episodes.length, total: episodes.length, per_page: episodes.length } },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
