import { NextResponse } from "next/server";
import { getAnimeFull } from "@/lib/jikan";
import { db } from "@/lib/db";
import { cacheAnimeData } from "@/lib/anime-cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;
  const id = Number(malId);

  try {
    // 1. Check DB cache (fresh < 24 hours)
    const cached = await db.cachedAnime.findUnique({ where: { malId: id } });
    if (cached) {
      const ageHrs = (Date.now() - cached.updatedAt.getTime()) / (1000 * 60 * 60);
      if (ageHrs < 24) {
        const anyDownloaded = await db.downloadedFile.findFirst({
          where: { malId: id }, orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({
          data: cached.data,
          cached: true,
          downloadStatus: { downloaded: !!anyDownloaded },
        });
      }
    }

    // 2. Fetch from Jikan
    const anime = await getAnimeFull(id);

    // 3. Cache to DB (includes poster auto-download)
    await cacheAnimeData(id, anime);

    const anyDownloaded = await db.downloadedFile.findFirst({
      where: { malId: id }, orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: anime,
      cached: false,
      downloadStatus: { downloaded: !!anyDownloaded },
    });
  } catch (error) {
    // 4. Fallback: expired cache
    const fallback = await db.cachedAnime.findUnique({ where: { malId: id } });
    if (fallback) {
      const anyDownloaded = await db.downloadedFile.findFirst({
        where: { malId: id }, orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        data: fallback.data,
        cached: true,
        stale: true,
        downloadStatus: { downloaded: !!anyDownloaded },
      });
    }

    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
