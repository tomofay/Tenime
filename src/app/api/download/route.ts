import { NextResponse } from "next/server";
import { downloadEpisode } from "@/lib/downloader";
import { downloadSchema } from "@/lib/validation";
import { createDownloadToken } from "@/lib/download-tokens";
import { withRateLimit } from "@/lib/api-utils";
import type { DownloadGroup } from "@/types/stream";

const DOWNLOAD_LIMIT = { windowMs: 60_000, maxRequests: 15 };

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

    let groups: DownloadGroup[] = downloadGroups as DownloadGroup[] | undefined || [];
    if (groups.length === 0) {
      const mirrors = parsed.data.mirrors ?? [];
      if (mirrors.length === 0) {
        return NextResponse.json({ success: false, error: "No download groups or mirrors provided" }, { status: 400 });
      }
      groups = [{ format: "mp4", quality: "720p", mirrors }];
    }

    const result = await downloadEpisode(malId, episodeNumber, animeTitle || "", groups, effectiveQuality);
    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }

    const token = createDownloadToken(result.filePath!, result.fileName!);

    return NextResponse.json({
      success: true,
      streamUrl: `/api/download/stream?token=${token}`,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
