import { existsSync } from "fs";
import path from "path";

const POSTER_DIR = path.join(process.cwd(), "public", "cache", "posters");

/** Local cached poster URL if downloaded, else null. Server-only (uses fs). */
export function localPosterUrl(malId: number): string | null {
  try {
    if (existsSync(path.join(POSTER_DIR, `anime-${malId}.webp`))) {
      return `/cache/posters/anime-${malId}.webp`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Map a Jikan anime (or any record with mal_id + images) to a card shape,
 * preferring the locally cached poster over the remote MAL CDN URL so cards
 * load from local disk instead of the slow myanimelist.net CDN.
 */
export function toCardWithLocalPoster(a: Record<string, any>): Record<string, any> {
  const malId = a.mal_id ?? a.malId;
  const local = malId ? localPosterUrl(malId) : null;
  if (!local) return a;

  const images = a.images;
  if (images) {
    if (images.webp) images.webp.large_image_url = local;
    if (images.jpg) images.jpg.large_image_url = local;
  }
  return a;
}
