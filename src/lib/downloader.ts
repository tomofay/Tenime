import { promises as fsp } from "fs";
import path from "path";
import os from "os";
import {
  scrapeAceFile,
  downloadFromPixelDrain,
  isValidVideo,
} from "./scraper/mirror-downloader";
import type { DownloadGroup } from "@/types/stream";

const TEMP_DIR = path.join(os.tmpdir(), "kicaunime-downloads");

function findMirrorByHost(groups: DownloadGroup[], hostPattern: string, format?: "mp4" | "mkv", quality?: string): { url: string; name: string } | null {
  let filtered = format ? groups.filter((g) => g.format === format) : groups;
  if (quality) filtered = filtered.filter((g) => g.quality === quality);
  for (const g of filtered) {
    const m = g.mirrors.find((m) => m.name.toLowerCase().includes(hostPattern) || m.url.toLowerCase().includes(hostPattern));
    if (m) return { url: m.url, name: m.name };
  }
  return null;
}

function getAcefileMirror(groups: DownloadGroup[], fmt: "mp4" | "mkv", quality?: string): { url: string; name: string } | null {
  return findMirrorByHost(groups, "acefile", fmt, quality);
}

function getPdrainMirror(groups: DownloadGroup[], fmt: "mp4" | "mkv", quality?: string): { url: string; name: string } | null {
  return findMirrorByHost(groups, "pdrain", fmt, quality) || findMirrorByHost(groups, "pixeldrain", fmt, quality);
}

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/html")) throw new Error("HTML response");
  return res.arrayBuffer();
}

async function tryFormat(
  method: "acefile-gdrive" | "acefile-direct" | "pixeldrain",
  groups: DownloadGroup[],
  fmt: "mp4" | "mkv",
  _quality: string
): Promise<{ buffer: ArrayBuffer; quality: string } | null> {
  const quality = fmt === "mkv" ? "1080p" : _quality;
  switch (method) {
    case "acefile-gdrive": {
      const mirror = getAcefileMirror(groups, fmt, quality);
      if (!mirror) { console.warn(`[download] ⚠️ No Acefile mirror in ${fmt} ${quality} group`); return null; }
      const result = await scrapeAceFile(mirror.url, fmt);
      if (!result) return null;
      if (result.type !== "gdrive") { console.warn(`[download] ⚠️ Acefile returned ${result.type}, expected gdrive`); return null; }
      const buf = await fetchBuffer(result.url);
      if (!isValidVideo(buf)) { console.warn(`[download] ⚠️ GDrive buffer failed validation (${buf.byteLength} bytes)`); return null; }
      return { buffer: buf, quality };
    }
    case "acefile-direct": {
      const mirror = getAcefileMirror(groups, fmt, quality);
      if (!mirror) { console.warn(`[download] ⚠️ No Acefile mirror in ${fmt} ${quality} group`); return null; }
      const result = await scrapeAceFile(mirror.url, fmt);
      if (!result) return null;
      if (result.type !== "direct") { console.warn(`[download] ⚠️ Acefile returned ${result.type}, expected direct`); return null; }
      const buf = await fetchBuffer(result.url);
      if (!isValidVideo(buf)) { console.warn(`[download] ⚠️ Direct buffer failed validation (${buf.byteLength} bytes)`); return null; }
      return { buffer: buf, quality };
    }
    case "pixeldrain": {
      const mirror = getPdrainMirror(groups, fmt, quality);
      if (!mirror) { console.warn(`[download] ⚠️ No PixelDrain mirror in ${fmt} ${quality} group`); return null; }
      const buf = await downloadFromPixelDrain(mirror.url);
      if (!isValidVideo(buf)) { console.warn(`[download] ⚠️ PixelDrain buffer failed validation (${buf.byteLength} bytes)`); return null; }
      return { buffer: buf, quality };
    }
  }
}

export async function downloadEpisode(
  malId: number, ep: number, animeTitle: string,
  downloadGroups: DownloadGroup[], quality = "720p"
): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> {
  await fsp.mkdir(TEMP_DIR, { recursive: true });

  const methods: Array<{ name: string; key: "acefile-direct" | "acefile-gdrive" | "pixeldrain" }> = [
    { name: "Acefile→Direct", key: "acefile-direct" },
    { name: "Acefile→GDrive", key: "acefile-gdrive" },
    { name: "PixelDrain", key: "pixeldrain" },
  ];

  let result: { buffer: ArrayBuffer; quality: string } | null = null;
  let usedFormat: "mp4" | "mkv" | null = null;
  let usedMethod = "";
  let usedQuality = quality;

  for (const method of methods) {
    console.log(`[download] ⏳ Trying ${method.name} for MAL ${malId} EP ${ep}...`);
    for (const fmt of ["mp4", "mkv"] as const) {
      try { result = await tryFormat(method.key, downloadGroups, fmt, quality); }
      catch (e) { console.warn(`[download] ❌ ${method.name} (${fmt}) failed: ${(e as Error).message}`); }
      if (result) { usedFormat = fmt; usedMethod = method.name; usedQuality = result.quality; break; }
      else console.warn(`[download] ⚠️ ${method.name} (${fmt}) returned no buffer`);
    }
    if (result) break;
  }

  if (!result || !isValidVideo(result.buffer)) {
    const err = "Semua metode gagal (Acefile→Direct, Acefile→GDrive, PixelDrain sudah dicoba MP4 & MKV)";
    console.warn(`[download] 🚫 MAL ${malId} EP ${ep} — ${err}`);
    return { success: false, error: err };
  }

  const ext = usedFormat === "mkv" ? ".mkv" : ".mp4";
  const safeTitle = animeTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\- ]/g, "").trim().slice(0, 50) || `anime-${malId}`;
  const fileName = `${safeTitle}-EP${String(ep).padStart(2, "0")}-${usedQuality}${ext}`;
  const filePath = path.join(TEMP_DIR, fileName);

  await fsp.writeFile(filePath, Buffer.from(result.buffer));

  console.log(`[download] ✅ MAL ${malId} EP ${ep} → ${usedFormat} ${usedQuality} via ${usedMethod}`);
  return { success: true, filePath, fileName };
}
