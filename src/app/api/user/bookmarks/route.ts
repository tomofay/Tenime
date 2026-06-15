import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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

  const { malId, title, posterUrl, score, type } = await request.json();

  if (!malId || !title) {
    return NextResponse.json(
      { error: "malId and title are required" },
      { status: 400 }
    );
  }

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
      posterUrl: posterUrl || null,
      score: score || null,
      type: type || null,
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
  const malId = searchParams.get("malId");

  if (!malId) {
    return NextResponse.json(
      { error: "malId is required" },
      { status: 400 }
    );
  }

  await db.bookmark.deleteMany({
    where: {
      userId: session.user.id,
      malId: Number(malId),
    },
  });

  return NextResponse.json({ success: true });
}
