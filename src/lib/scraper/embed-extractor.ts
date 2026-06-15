import * as cheerio from "cheerio";
import type { Mirror, MirrorOption } from "@/types/stream";

export interface ParsedStream {
  embedUrl: string | null;
  qualities: { quality: string; mirrors: MirrorOption[] }[];
  mirrors: Mirror[];
}

export function extractEmbedUrl(html: string): ParsedStream {
  const $ = cheerio.load(html);
  let embedUrl: string | null = null;
  const qualities: { quality: string; mirrors: MirrorOption[] }[] = [];
  const downloadMirrors: Mirror[] = [];

  // Try multiple selectors in priority order
  embedUrl = $("#pembed iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $(".pembed iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $(".player-embed iframe, .responsive-embed-stream iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $("#embed_holder iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $("iframe").first().attr("src") || null;

  // Debug log
  const iframeCount = $("iframe").length;
  const allIframeSrcs = $("iframe").map((_, el) => $(el).attr("src") || "").get().filter(Boolean);
  console.log(`[embed-extractor] Found ${iframeCount} iframes. Sources:`, allIframeSrcs.slice(0, 5), `| Selected: ${embedUrl || "NULL"}`);
  
  // If no iframes found, dump first 500 chars of body
  if (iframeCount === 0) {
    const bodyText = $("body").text().trim().slice(0, 500);
    const hasPlayer = !!$("#pembed, #embed_holder, .player-embed").length;
    console.log(`[embed-extractor] Body preview: "${bodyText}" | Has player div: ${hasPlayer}`);
  }

  $(".mirrorstream ul").each((_, ul) => {
    const cls = $(ul).attr("class") || "";
    const m = cls.match(/m(\d+p)/);
    if (!m) return;

    const quality = m[1];
    const mirrors: MirrorOption[] = [];

    $(ul)
      .find("li a")
      .each((_, a) => {
        const name = $(a).text().trim();
        const dataContent = $(a).attr("data-content");
        if (!name || !dataContent) return;

        try {
          const decoded = JSON.parse(
            Buffer.from(dataContent, "base64").toString("utf-8")
          );
          mirrors.push({
            name,
            id: decoded.id as number,
            i: decoded.i as number,
            q: decoded.q as string,
          });
        } catch {
          // skip if can't decode
        }
      });

    if (mirrors.length > 0) {
      qualities.push({ quality, mirrors });
    }
  });

  $(".download ul li a").each((_, el) => {
    const url = $(el).attr("href");
    const name = $(el).text().trim();
    if (url && name && url.startsWith("http")) {
      downloadMirrors.push({ name, url });
    }
  });

  return { embedUrl, qualities, mirrors: downloadMirrors };
}
