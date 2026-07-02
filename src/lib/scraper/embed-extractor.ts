import * as cheerio from "cheerio";
import type { MirrorOption, DownloadGroup } from "@/types/stream";

export interface ParsedStream {
  embedUrl: string | null;
  qualities: { quality: string; mirrors: MirrorOption[] }[];
  downloadGroups: DownloadGroup[];
}

export function extractEmbedUrl(html: string): ParsedStream {
  const $ = cheerio.load(html);
  let embedUrl: string | null = null;
  const qualities: { quality: string; mirrors: MirrorOption[] }[] = [];
  const downloadGroups: DownloadGroup[] = [];

  // Try multiple selectors in priority order
  embedUrl = $("#pembed iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $(".pembed iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $(".player-embed iframe, .responsive-embed-stream iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $("#embed_holder iframe").first().attr("src") || null;
  if (!embedUrl) embedUrl = $("iframe").first().attr("src") || null;

  // Stream mirrors
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
          mirrors.push({ name, id: decoded.id as number, i: decoded.i as number, q: decoded.q as string });
        } catch { /* skip */ }
      });

    if (mirrors.length > 0) qualities.push({ quality, mirrors });
  });

  // Grouped download: <li><strong>Mp4 720p</strong> <a...> <a...> <i>137.8 MB</i></li>
  $(".download ul li").each((_, li) => {
    const strongText = $(li).find("strong").first().text().trim().toLowerCase();
    if (!strongText) return;

    const fmtMatch = strongText.match(/(mp4|mkv|480p|720p|1080p|360p)/i);
    if (!fmtMatch) return;

    let format: "mp4" | "mkv" = "mp4";
    let quality: DownloadGroup["quality"] = "720p";

    if (strongText.includes("mkv")) format = "mkv";
    if (strongText.includes("mp4")) format = "mp4";

    const qMatch = strongText.match(/(\d+p)/);
    if (qMatch) {
      const q = qMatch[1] as DownloadGroup["quality"];
      if (["360p", "480p", "720p", "1080p"].includes(q)) quality = q;
    }

    const groupMirrors: { name: string; url: string }[] = [];
    $(li).find("a").each((_, a) => {
      const url = $(a).attr("href");
      const name = $(a).text().trim();
      if (name.toLowerCase().includes("vidhide")) return;
      if (url && name && url.startsWith("http")) {
        groupMirrors.push({ name, url });
      }
    });

    if (groupMirrors.length > 0) {
      downloadGroups.push({ format, quality, mirrors: groupMirrors });
    }
  });

  return { embedUrl, qualities, downloadGroups };
}
