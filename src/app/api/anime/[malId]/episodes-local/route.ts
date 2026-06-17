import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;
  const id = Number(malId);

  try {
    const files = await db.downloadedFile.findMany({
      where: { malId: id },
      select: { episodeNumber: true, quality: true, sizeBytes: true, filePath: true },
      orderBy: { episodeNumber: "asc" },
    });

    // Group by episode number
    const grouped = new Map<number, { qualities: string[]; sizeBytes: number }>();
    for (const f of files) {
      const entry = grouped.get(f.episodeNumber) || { qualities: [], sizeBytes: 0 };
      entry.qualities.push(f.quality);
      const size = typeof f.sizeBytes === "bigint" ? Number(f.sizeBytes) : (f.sizeBytes ? Number(f.sizeBytes) : 0);
      entry.sizeBytes += size;
      grouped.set(f.episodeNumber, entry);
    }

    const episodes = [...grouped.entries()].map(([ep, data]) => ({
      mal_id: id,
      title: `Episode ${ep}`,
      episode: String(ep),
      url: null,
      score: null,
      filler: false,
      recap: false,
      downloadedQualities: data.qualities,
    }));

    return NextResponse.json({ data: episodes });
  } catch (e) {
    console.error(`/api/anime/${malId}/episodes-local`, e);
    return NextResponse.json({ data: [] });
  }
}
