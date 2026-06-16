import { NextResponse } from "next/server";
import { getEpisodeStream } from "@/lib/scraper";
import { getLocalStreamUrl } from "@/lib/downloader";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/api-utils";

const STREAM_LIMIT = { windowMs: 60_000, maxRequests: 30 };

export async function GET(request: Request) {
  // Rate limit: 30 requests per minute per IP
  const rateLimit = withRateLimit(request, STREAM_LIMIT);
  if (rateLimit) return rateLimit;
  const { searchParams } = new URL(request.url);

  const malId = searchParams.get("malId");
  const ep = searchParams.get("ep");
  const title = searchParams.get("title");

  if (!malId || !ep) {
    return NextResponse.json({ error: "Missing malId or ep parameter" }, { status: 400 });
  }

  const malIdNum = Number(malId);
  const epNum = Number(ep);

  if (isNaN(malIdNum) || isNaN(epNum) || epNum < 1) {
    return NextResponse.json({ error: "Invalid malId or ep parameter" }, { status: 400 });
  }

  try {
    // Check local file first
    const local = await getLocalStreamUrl(malIdNum, epNum);
    if (local) {
      return NextResponse.json({ ...local, source: "local" });
    }

    // If title missing or generic fallback, fetch from Jikan cache
    let resolvedTitle: string | undefined | null = title;
    if (!resolvedTitle || resolvedTitle.startsWith("anime-")) {
      try {
        const cached = await db.cachedAnime.findUnique({ where: { malId: malIdNum } });
        if (cached) {
          const data = cached.data as Record<string, unknown>;
          resolvedTitle = (data.title as string) || null;
        }
      } catch { /* continue without title */ }
    }

    const result = await getEpisodeStream(malIdNum, epNum, resolvedTitle || undefined);

    if (!result.embedUrl) {
      return NextResponse.json(
        { error: "Stream source not found", episode: result.episode, embedUrl: "", qualities: result.qualities, mirrors: result.mirrors },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Scraper error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
