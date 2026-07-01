import { db } from "@/lib/db";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "public", "cache", "posters");

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

export async function cacheAnimeData(malId: number, data: unknown): Promise<void> {
  try {
    await db.cachedAnime.upsert({
      where: { malId },
      update: { data: data as object, updatedAt: new Date() },
      create: { malId, data: data as object },
    });

    // Download & cache poster locally
    const d = data as Record<string, unknown>;
    const images = d.images as { webp?: { large_image_url: string }; jpg?: { large_image_url: string } } | undefined;
    const posterUrl = images?.webp?.large_image_url || images?.jpg?.large_image_url;

    if (posterUrl) {
      try {
        ensureCacheDir();
        const posterPath = path.join(CACHE_DIR, `anime-${malId}.webp`);

        if (!existsSync(posterPath)) {
          const res = await fetch(posterUrl);
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            writeFileSync(posterPath, buffer);
          }
        }
      } catch (e) {
        console.error("[anime-cache] Failed to download poster for malId=" + malId, e);
      }
    }
  } catch (e) {
    console.error("[anime-cache] Failed to cache anime malId=" + malId, e);
  }
}

export async function getCachedAnimeData(malId: number): Promise<unknown | null> {
  const cached = await db.cachedAnime.findUnique({ where: { malId } });
  if (!cached) return null;
  // Permanent cache — never expire
  // Replace poster URL with local cache if available
  const data = cached.data as Record<string, unknown>;
  const localPoster = `/cache/posters/anime-${malId}.webp`;
  ensureCacheDir();
  if (existsSync(path.join(CACHE_DIR, `anime-${malId}.webp`))) {
    const images = data.images as { webp: { large_image_url: string; image_url: string; small_image_url: string }; jpg: { large_image_url: string; image_url: string; small_image_url: string } };
    if (images) {
      images.webp.large_image_url = localPoster;
      images.webp.image_url = localPoster;
      images.jpg.large_image_url = localPoster;
      images.jpg.image_url = localPoster;
    }
  }

  return data;
}
