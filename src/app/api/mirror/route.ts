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
    console.log(`[mirror] Got embed HTML (${html.length} chars)`);

    const $ = cheerio.load(html);
    const iframeSrc = $("iframe").first().attr("src");
    console.log(`[mirror] iframe src: ${iframeSrc || "(none)"}`);

    if (!iframeSrc) {
      return NextResponse.json({ embedUrl: html });
    }

    // For desustream: try to extract video URL directly
    if (iframeSrc.includes("desustream.me")) {
      console.log(`[mirror] Desustream detected, fetching page...`);
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
        console.log(`[mirror] Desustream page: ${pageHtml.length} chars, status ${pageRes.status}, content-type: ${pageRes.headers.get("content-type")}`);

        // Try all script tags
        const page = cheerio.load(pageHtml);
        const scripts = page("script").toArray();
        console.log(`[mirror] Found ${scripts.length} script tags`);
        for (let i = 0; i < scripts.length; i++) {
          const text = page(scripts[i]).html() || "";
          if (text.length > 50) {
            console.log(`[mirror] Script #${i} (${text.length} chars): ${text.slice(0, 200)}...`);
          }
          const gvMatch = text.match(/(https?:\/\/[^"'\s]*googlevideo\.com\/videoplayback[^"'\s]*)/i);
          if (gvMatch) {
            console.log(`[mirror] ✅ Found googlevideo URL in script #${i}!`);
            return NextResponse.json({ embedUrl: gvMatch[1], directVideo: true });
          }
        }

        // Try inline src or data attributes on video elements
        const videoSrc = page("video source").first().attr("src") || page("video").first().attr("src");
        if (videoSrc && videoSrc.includes("googlevideo.com")) {
          console.log(`[mirror] ✅ Found video src, proxying`);
          const proxyUrl = `/api/stream/video?url=${encodeURIComponent(videoSrc)}`;
          return NextResponse.json({ embedUrl: proxyUrl, directVideo: true });
        }

        // Look for video URL patterns in the entire page
        const videoMatch = pageHtml.match(/(https?:\/\/[^"'\s]*googlevideo\.com\/videoplayback[^"'\s]*)/i);
        if (videoMatch) {
          console.log(`[mirror] ✅ Found googlevideo URL in page, proxying`);
          const proxyUrl = `/api/stream/video?url=${encodeURIComponent(videoMatch[1])}`;
          return NextResponse.json({ embedUrl: proxyUrl, directVideo: true });
        }

        console.log(`[mirror] ⚠️ No video URL found, falling back to proxy`);
        const u = new URL(iframeSrc);
        return NextResponse.json({ embedUrl: `/api/mirror/proxy${u.pathname}${u.search}` });
      } catch (e) {
        console.error(`[mirror] Error fetching desustream:`, (e as Error).message);
        const u = new URL(iframeSrc);
        return NextResponse.json({ embedUrl: `/api/mirror/proxy${u.pathname}${u.search}` });
      }
    }

    return NextResponse.json({ embedUrl: iframeSrc });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[mirror] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
