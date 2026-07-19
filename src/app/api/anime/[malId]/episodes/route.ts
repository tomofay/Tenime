import { NextResponse } from "next/server";
import { getAnimeEpisodes, getAnimeFull } from "@/lib/jikan";
import { db } from "@/lib/db";
import { resolveAnime } from "@/lib/scraper/slug-resolver";
import type { Episode } from "@/types/anime";

async function getAnimeTitle(id: number): Promise<string> {
  const cached = await db.cachedAnime.findUnique({
    where: { malId: id },
    select: { data: true },
  });
  if (cached) {
    const title = (cached.data as Record<string, unknown>)?.title as string | undefined;
    if (title) return title;
  }
  try {
    const anime = await getAnimeFull(id);
    return anime.title;
  } catch {
    return "";
  }
}

function synthesizeEpisode(id: number, number: number, title: string): Episode {
  return {
    mal_id: id,
    title: title || `Episode ${number}`,
    episode: String(number),
    url: null,
    score: null,
    filler: false,
    recap: false,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;
  const id = Number(malId);

  let data: Episode[] = [];

  try {
    const result = await getAnimeEpisodes(id);
    data = result.data;
  } catch (e) {
    console.warn(`[api/anime/${id}/episodes] Jikan failed:`, (e as Error).message);
    // No Jikan episodes — fall back to Otakudesu below instead of synthesizing.
  }

  const useOtakuOnly = data.length === 0;

  // Merge Otakudesu episodes. If Jikan has none, use the Otakudesu list directly.
  try {
    const title = await getAnimeTitle(id);
    if (title) {
      const { episodes: otakuEps } = await resolveAnime(id, title);
      if (otakuEps.length > 0) {
        if (useOtakuOnly) {
          data = otakuEps
            .map((oe) => synthesizeEpisode(id, oe.number, oe.title))
            .sort((a, b) => parseInt(a.episode) - parseInt(b.episode));
        } else {
          const existingNums = new Set(
            data.map((ep) => parseInt(ep.episode)).filter((n) => !Number.isNaN(n))
          );
          const extra = otakuEps
            .filter((oe) => !existingNums.has(oe.number))
            .map((oe) => synthesizeEpisode(id, oe.number, oe.title));
          if (extra.length > 0) {
            data = [...data, ...extra].sort(
              (a, b) => parseInt(a.episode) - parseInt(b.episode)
            );
          }
        }
      }
    }
  } catch (e) {
    console.warn(`[api/anime/${id}/episodes] Otakudesu merge skipped:`, (e as Error).message);
  }

  // Drop episodes without a valid episode number (e.g. Jikan specials/OVAs
  // with empty numbers) instead of fabricating ep numbers.
  const data_ = data.filter((ep) => {
    const n = parseInt(ep.episode);
    return !Number.isNaN(n) && n > 0;
  });
  const count = data_.length;
  return NextResponse.json({
    data: data_,
    pagination: {
      last_visible_page: 1,
      has_next_page: false,
      current_page: 1,
      items: { count, total: count, per_page: count },
    },
  });
}
