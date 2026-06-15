import { NextResponse } from "next/server";
import { getAnimeFull } from "@/lib/jikan";
import { db } from "@/lib/db";
import { getDownloadStatus } from "@/lib/downloader";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { malIds } = body;

    if (!Array.isArray(malIds)) {
      return NextResponse.json({ error: "malIds array required" }, { status: 400 });
    }

    const results: Record<string, unknown> = {};

    for (const malId of malIds.slice(0, 25)) {
      try {
        const anime = await getAnimeFull(malId);
        await db.cachedAnime.upsert({
          where: { malId },
          update: { data: anime as object, updatedAt: new Date() },
          create: { malId, data: anime as object },
        });

        const download = await getDownloadStatus(malId, 0);
        results[String(malId)] = {
          title: anime.title,
          episodes: anime.episodes,
          score: anime.score,
          status: anime.status,
          type: anime.type,
          year: anime.year,
          poster: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || null,
          downloaded: download.downloaded,
        };
      } catch {
        results[String(malId)] = { error: "failed" };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
