import type { Anime } from "@/types/anime";

const NSFW_RATINGS = ["rx", "hentai"];

/** True if the anime is NSFW (hentai / explicit). */
export function isNsfw(anime: Partial<Anime> | null | undefined): boolean {
  if (!anime) return false;
  const rating = (anime.rating || "").toLowerCase();
  if (NSFW_RATINGS.some((r) => rating.includes(r))) return true;
  const explicit = anime.explicit_genres;
  if (Array.isArray(explicit) && explicit.length > 0) return true;
  return false;
}

/** Drop NSFW entries from a list (null-safe). */
export function filterNsfw<T extends Partial<Anime>>(list: T[] | undefined | null): T[] {
  if (!list) return [];
  return list.filter((a) => !isNsfw(a));
}
