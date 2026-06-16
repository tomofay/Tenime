import { NextResponse } from "next/server";
import { downloadEpisode, getDownloadStatus } from "@/lib/downloader";
import { extractAceFileData } from "@/lib/scraper/acefile-extractor";
import { downloadSchema, downloadQuerySchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/api-utils";

const DOWNLOAD_LIMIT = { windowMs: 60_000, maxRequests: 10 };

export async function GET(request: Request) {
  const rateLimit = withRateLimit(request, DOWNLOAD_LIMIT);
  if (rateLimit) return rateLimit;

  const { searchParams } = new URL(request.url);
  const parsed = downloadQuerySchema.safeParse({
    malId: searchParams.get("malId"),
    ep: searchParams.get("ep"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid malId or ep" }, { status: 400 });
  }

  try {
    const status = await getDownloadStatus(parsed.data.malId, parsed.data.ep);
    return NextResponse.json(status);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, DOWNLOAD_LIMIT);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const parsed = downloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { malId, episodeNumber, animeTitle, url, quality } = parsed.data;

    const gd = await extractAceFileData(url);

    if (!gd) {
      return NextResponse.json({ success: false, error: "Could not extract Google Drive info from AceFile" }, { status: 500 });
    }

    const result = await downloadEpisode(malId, episodeNumber, animeTitle, url, quality);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
