import { readFile, access } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const AVATARS_DIR = path.join(process.cwd(), "uploads", "avatars");

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (!user?.avatarUrl) {
    return new NextResponse(null, { status: 404 });
  }

  const filepath = path.join(AVATARS_DIR, user.avatarUrl);

  try {
    await access(filepath);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const ext = path.extname(user.avatarUrl).slice(1).toLowerCase();
  const mime = MIME_MAP[ext] || "application/octet-stream";
  const buffer = await readFile(filepath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-cache",
    },
  });
}
