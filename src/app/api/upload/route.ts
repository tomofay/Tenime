import { NextResponse } from "next/server";
import { writeFile, mkdir, stat } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const malId = Number(form.get("malId"));
    const episodeNumber = Number(form.get("ep"));
    const animeTitle = (form.get("title") as string) || "";
    const quality = (form.get("quality") as string) || "720p";

    if (!file || !malId || !episodeNumber || isNaN(malId) || isNaN(episodeNumber) || episodeNumber < 1) {
      return NextResponse.json({ error: "Missing file, malId, or ep" }, { status: 400 });
    }

    const ext = file.name.match(/\.(mp4|mkv|webm)$/i)?.[1]?.toLowerCase() || "mp4";
    const fileName = `${malId}-ep${String(episodeNumber).padStart(2, "0")}-${quality}.${ext}`;

    await mkdir(DOWNLOADS_DIR, { recursive: true });
    const filePath = path.join(DOWNLOADS_DIR, fileName);

    // arrayBuffer — ok now that bodySizeLimit is 5GB
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);

    const fileStat = await stat(filePath);

    await db.downloadedFile.upsert({
      where: { malId_episodeNumber_quality: { malId, episodeNumber, quality } },
      update: { filePath, fileName, sizeBytes: BigInt(fileStat.size), animeTitle: animeTitle || undefined },
      create: { malId, animeTitle: animeTitle || "", episodeNumber, quality, fileName, filePath, sizeBytes: BigInt(fileStat.size), source: "manual" },
    });

    return NextResponse.json({ success: true, fileName, sizeBytes: Number(fileStat.size) });
  } catch (e) {
    console.error("/api/upload", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
