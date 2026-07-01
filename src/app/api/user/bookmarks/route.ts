import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookmarkCreateSchema, bookmarkDeleteSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await db.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = bookmarkCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { malId, title, posterUrl, score, type, status } = parsed.data;

  const existing = await db.bookmark.findUnique({
    where: { userId_malId: { userId: session.user.id, malId } },
  });

  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const bookmark = await db.bookmark.create({
    data: {
      userId: session.user.id,
      malId,
      title,
      posterUrl,
      score,
      type,
      status,
    },
  });

  return NextResponse.json(bookmark, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = bookmarkDeleteSchema.safeParse({ malId: searchParams.get("malId") });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid malId" }, { status: 400 });
  }

  await db.bookmark.deleteMany({
    where: {
      userId: session.user.id,
      malId: parsed.data.malId,
    },
  });

  return NextResponse.json({ success: true });
}
