import { writeFile, mkdir, readFile, access } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const AVATARS_DIR = path.join(process.cwd(), "uploads", "avatars");

async function ensureDir() {
  await mkdir(AVATARS_DIR, { recursive: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bio = formData.get("bio") as string | null;

  const updateData: Record<string, unknown> = {};
  if (bio !== null) updateData.bio = bio;

  if (file) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Allowed: PNG, JPEG, WebP, GIF" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 });
    }

    await ensureDir();
    const ext = file.type.split("/")[1];
    const filename = `${session.user.id}.${ext}`;
    const filepath = path.join(AVATARS_DIR, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, bytes);
    updateData.avatarUrl = filename;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No data to update" }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, email: true, avatarUrl: true, bio: true },
  });

  return NextResponse.json(user);
}
