import { NextResponse } from "next/server";
import { existsSync, statSync } from "fs";
import path from "path";
import { createReadStream } from "fs";

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments: string[] }> }
) {
  const segments = await params.then((p) => p.segments);
  // segments = [malId, episodeNumber, quality]
  const [malId, episodeNumber, quality] = segments;

  const patterns = [
    `${malId}-ep${episodeNumber}-${quality}.mp4`,
    `${malId}-ep${String(Number(episodeNumber)).padStart(2, "0")}-${quality}.mp4`,
  ];

  for (const pattern of patterns) {
    const filePath = path.join(DOWNLOADS_DIR, pattern);
    if (existsSync(filePath)) {
      const stat = statSync(filePath);
      const stream = createReadStream(filePath);

      return new Response(stream as unknown as ReadableStream, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": String(stat.size),
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  return NextResponse.json(
    { error: "Local file not found" },
    { status: 404 }
  );
}
