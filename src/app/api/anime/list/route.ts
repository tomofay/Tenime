import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDownloadStatus } from "@/lib/downloader";

export async function GET() {
  try {
    const cached = await db.cachedAnime.findMany({
      select: { malId: true, data: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const results = await Promise.all(
      cached.map(async (item) => {
        const data = item.data as Record<string, unknown>;
        const download = await getDownloadStatus(item.malId, 0);
        return {
          malId: item.malId,
          title: data.title,
          episodes: data.episodes,
          score: data.score,
          status: data.status,
          type: data.type,
          year: data.year,
          poster: data.images
            ? (data.images as { webp?: { large_image_url: string }; jpg?: { large_image_url: string } }).webp
                ?.large_image_url ??
              (data.images as { jpg?: { large_image_url: string } }).jpg?.large_image_url
            : null,
          updatedAt: item.updatedAt,
          downloaded: download.downloaded,
        };
      })
    );

    return NextResponse.json({ count: results.length, results });
  } catch {
    return NextResponse.json({ count: 0, results: [] });
  }
}
