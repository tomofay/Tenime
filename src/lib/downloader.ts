import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { existsSync, statSync } from "fs";
import { promises as fsp } from "fs";
import path from "path";
import {
  scrapeAceFile,
  downloadFromPixelDrain,
  isValidVideo,
} from "./scraper/mirror-downloader";
import type { DownloadGroup } from "@/types/stream";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname, port: Number(url.port) || 3306,
    user: url.username || "root", password: url.password || "",
    database: url.pathname.replace("/", ""), connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");

async function saveToDb(malId: number, ep: number, animeTitle: string, quality: string, filePath: string) {
  const stats = await fsp.stat(filePath);
  await db.downloadedFile.upsert({
    where: { malId_episodeNumber_quality: { malId, episodeNumber: ep, quality } },
    update: { filePath, fileName: path.basename(filePath), sizeBytes: stats.size, animeTitle, source: "download" },
    create: { malId, animeTitle, episodeNumber: ep, quality, fileName: path.basename(filePath), filePath, sizeBytes: stats.size, source: "download" },
  });
}

export async function checkLocalFile(malId: number, ep: number, quality = "720p") {
  const record = await db.downloadedFile.findUnique({
    where: { malId_episodeNumber_quality: { malId, episodeNumber: ep, quality } },
  });
  if (record && existsSync(record.filePath) && statSync(record.filePath).size > 1_000_000) {
    return { exists: true, filePath: record.filePath, fileName: record.fileName };
  }
  if (record) {
    try { await fsp.unlink(record.filePath); } catch {}
    await db.downloadedFile.delete({ where: { id: record.id } });
  }
  return { exists: false, filePath: null, fileName: null };
}

export async function getLocalStreamUrl(malId: number, ep: number) {
  for (const q of ["720p", "480p", "360p", "1080p"]) {
    const local = await checkLocalFile(malId, ep, q);
    if (local.exists && local.filePath) return { embedUrl: `/api/stream/local/${malId}/${ep}/${q}`, source: "local" };
  }
  return null;
}

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
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const existing = await checkLocalFile(malId, ep, quality);
  if (existing.exists) return { success: true, filePath: existing.filePath! };

  await fsp.mkdir(DOWNLOADS_DIR, { recursive: true });

  const methods: Array<{ name: string; key: "acefile-gdrive" | "acefile-direct" | "pixeldrain" }> = [
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
  const filePath = path.join(DOWNLOADS_DIR, `${malId}-ep${String(ep).padStart(2, "0")}-${usedQuality}${ext}`);

  await fsp.writeFile(filePath, Buffer.from(result.buffer));
  await saveToDb(malId, ep, animeTitle, usedQuality, filePath);

  console.log(`[download] ✅ MAL ${malId} EP ${ep} → ${usedFormat} ${usedQuality} via ${usedMethod}`);
  return { success: true, filePath };
}

export async function getDownloadStatus(malId: number, ep: number) {
  const local = await getLocalStreamUrl(malId, ep);
  if (local) {
    const record = await db.downloadedFile.findFirst({ where: { malId, episodeNumber: ep }, orderBy: { createdAt: "desc" } });
    return { downloaded: true, quality: record?.quality ?? "", filePath: record?.filePath ?? "" };
  }
  return { downloaded: false };
}
