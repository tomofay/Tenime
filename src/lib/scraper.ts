import { getFromCache, setToCache } from "@/lib/cache";
import { resolveAnime } from "./scraper/slug-resolver";
import { fetchEpisodeStreamFromUrl } from "./scraper/otakudesu";
import type { StreamSource } from "@/types/stream";

const CACHE_TTL = Number(process.env.SCRAPER_CACHE_TTL_MS) || 30000;

export async function getEpisodeStream(
  malId: number,
  episode: number,
  jikanTitle?: string
): Promise<StreamSource> {
  const cacheKey = `stream:${malId}:${episode}`;
  const cached = getFromCache<StreamSource>(cacheKey);
  if (cached) return cached;

  const title = jikanTitle || `anime-${malId}`;
  const resolved = await resolveAnime(malId, title);
  const epLink = resolved.episodes.find((e) => e.number === episode);

  if (!epLink) {
    return { episode, embedUrl: "", qualities: [], mirrors: [], episodeUrl: "" };
  }

  const stream = await fetchEpisodeStreamFromUrl(epLink.url);

  const result: StreamSource = {
    episode,
    embedUrl: stream.embedUrl || "",
    qualities: stream.qualities,
    mirrors: stream.mirrors,
    episodeUrl: epLink.url,
  };

  if (result.embedUrl) {
    setToCache(cacheKey, result, CACHE_TTL);
  }
  return result;
}
