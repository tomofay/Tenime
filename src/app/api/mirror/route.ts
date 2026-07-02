import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { fetchMirrorEmbed } from "@/lib/scraper/mirror-fetcher";
import { mirrorQuerySchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/api-utils";

const MIRROR_LIMIT = { windowMs: 60_000, maxRequests: 20 };

export async function GET(request: Request) {
  const rateLimit = withRateLimit(request, MIRROR_LIMIT);
  if (rateLimit) return rateLimit;
  const { searchParams } = new URL(request.url);
  const parsed = mirrorQuerySchema.safeParse({
    id: searchParams.get("id"),
    i: searchParams.get("i"),
    q: searchParams.get("q"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing id, i, or q parameter" }, { status: 400 });
  }

  try {
    const { id, i, q } = parsed.data;
    const html = await fetchMirrorEmbed(id, i, q);

    const $ = cheerio.load(html);
    const iframeSrc = $("iframe").first().attr("src");

    if (!iframeSrc) {
      return NextResponse.json({ embedUrl: html });
    }

    if (iframeSrc.includes("desustream.me")) {
      try {
        const pageRes = await fetch(iframeSrc, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0",
            Referer: "https://otakudesu.blog/",
            "Accept-Encoding": "identity",
          },
          redirect: "follow",
        });
        const pageHtml = await pageRes.text();
        const page = cheerio.load(pageHtml);

        const videoSrc = page("video source").first().attr("src") || page("video").first().attr("src");
        if (videoSrc && videoSrc.includes("googlevideo.com")) {
          return NextResponse.json({
            embedUrl: `/api/stream/video?url=${encodeURIComponent(videoSrc)}`,
            directVideo: true,
          });
        }

        const videoMatch = pageHtml.match(/(https?:\/\/[^"'\s]*googlevideo\.com\/videoplayback[^"'\s]*)/i);
        if (videoMatch) {
          return NextResponse.json({
            embedUrl: `/api/stream/video?url=${encodeURIComponent(videoMatch[1])}`,
            directVideo: true,
          });
        }
      } catch {}

      const u = new URL(iframeSrc);
      return NextResponse.json({ embedUrl: `/api/mirror/proxy${u.pathname}${u.search}` });
    }

    return NextResponse.json({ embedUrl: iframeSrc });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
