import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { existsSync, statSync, writeFileSync } from "fs";
import path from "path";
import { extractAceFileData, getGoogleDriveDirectUrl } from "./scraper/acefile-extractor";

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

function getLocalFilePath(malId: number, ep: number, quality: string): string {
  return path.join(DOWNLOADS_DIR, `${malId}-ep${String(ep).padStart(2, "0")}-${quality}.mp4`);
}

function findLocalFile(malId: number, ep: number, quality: string): string | null {
  for (const name of [
    `${malId}-ep${ep}-${quality}.mp4`,
    `${malId}-ep${String(ep).padStart(2, "0")}-${quality}.mp4`,
    `${malId}-ep${ep}-${quality}.mkv`,
    `${malId}-ep${String(ep).padStart(2, "0")}-${quality}.mkv`,
  ]) {
    const p = path.join(DOWNLOADS_DIR, name);
    if (existsSync(p)) return p;
  }
  return null;
}

export async function checkLocalFile(malId: number, ep: number, quality = "720p") {
  const record = await db.downloadedFile.findUnique({
    where: { malId_episodeNumber_quality: { malId, episodeNumber: ep, quality } },
  });
  if (record) {
    if (existsSync(record.filePath) && statSync(record.filePath).size > 0) {
      return { exists: true, filePath: record.filePath, fileName: record.fileName };
    }
    await db.downloadedFile.delete({ where: { id: record.id } });
  }
  const local = findLocalFile(malId, ep, quality);
  if (local && statSync(local).size > 0) {
    const s = statSync(local);
    await db.downloadedFile.create({
      data: { malId, animeTitle: "", episodeNumber: ep, quality, fileName: path.basename(local), filePath: local, sizeBytes: s.size, source: "manual" },
    });
    return { exists: true, filePath: local, fileName: path.basename(local) };
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

export async function downloadEpisode(
  malId: number, ep: number, animeTitle: string, acefileUrl: string, quality = "720p"
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const filePath = getLocalFilePath(malId, ep, quality);

  const existing = await checkLocalFile(malId, ep, quality);
  if (existing.exists) return { success: true, filePath: existing.filePath! };

  const gd = await extractAceFileData(acefileUrl);
  if (!gd) return { success: false, error: "Could not extract Google Drive info from AceFile" };

  const directUrl = getGoogleDriveDirectUrl(gd.fileId, gd.apiKey);

  const response = await fetch(directUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
  });

  if (!response.ok) return { success: false, error: `Drive download failed: HTTP ${response.status}` };

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);

  const stats = statSync(filePath);

  await db.downloadedFile.upsert({
    where: { malId_episodeNumber_quality: { malId, episodeNumber: ep, quality } },
    update: { filePath, fileName: path.basename(filePath), sizeBytes: stats.size, source: "download" },
    create: { malId, animeTitle, episodeNumber: ep, quality, fileName: path.basename(filePath), filePath, sizeBytes: stats.size, source: "download" },
  });

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
