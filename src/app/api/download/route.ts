import { NextResponse } from "next/server";
import { downloadEpisode, getDownloadStatus } from "@/lib/downloader";
import { downloadSchema, downloadQuerySchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/api-utils";
import type { DownloadGroup } from "@/types/stream";

const DOWNLOAD_LIMIT = { windowMs: 60_000, maxRequests: 15 };
const BATCH_LIMIT = { windowMs: 60_000, maxRequests: 30 };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isBatch = url.searchParams.get("batch") === "1";
  const rateLimit = withRateLimit(request, isBatch ? BATCH_LIMIT : DOWNLOAD_LIMIT);
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
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
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

    const { malId, episodeNumber, animeTitle, quality, downloadGroups } = parsed.data;
    const effectiveQuality = quality || "720p";

    // Use downloadGroups if available, otherwise fall back to mirrors
    let groups: DownloadGroup[] = downloadGroups as DownloadGroup[] | undefined || [];
    if (groups.length === 0) {
      // Build basic groups from flat mirrors (backward compat)
      const mirrors = (parsed.data as any).mirrors || [];
      if (mirrors.length === 0) {
        return NextResponse.json({ success: false, error: "No download groups or mirrors provided" }, { status: 400 });
      }
      groups = [{ format: "mp4", quality: "720p", mirrors }];
    }

    const result = await downloadEpisode(malId, episodeNumber, animeTitle || "", groups, effectiveQuality);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
