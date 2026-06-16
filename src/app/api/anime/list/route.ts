import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cached = await db.cachedAnime.findMany({
      select: { malId: true, data: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Batch fetch all download statuses
    const malIds = cached.map((c) => c.malId);
    const downloads = await db.downloadedFile.findMany({
      where: { malId: { in: malIds } },
      select: { malId: true },
      distinct: ["malId"],
    });
    const downloadedMalIds = new Set(downloads.map((d) => d.malId));

    const results = cached.map((item) => {
      const data = item.data as Record<string, unknown>;
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
        downloaded: downloadedMalIds.has(item.malId),
      };
    });

    return NextResponse.json({ count: results.length, results });
  } catch {
    return NextResponse.json({ count: 0, results: [] });
  }
}
