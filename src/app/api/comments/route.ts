import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const malId = searchParams.get("malId");
  const ep = searchParams.get("ep");

  if (!malId || !ep) {
    return NextResponse.json({ error: "malId and ep required" }, { status: 400 });
  }

  const comments = await db.comment.findMany({
    where: { malId: Number(malId), episodeNumber: Number(ep) },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { malId, episodeNumber, body } = await request.json();
  if (!malId || !episodeNumber || !body || !body.trim()) {
    return NextResponse.json({ error: "malId, episodeNumber, and body required" }, { status: 400 });
  }

  const comment = await db.comment.create({
    data: {
      userId: session.user.id,
      malId,
      episodeNumber,
      body: body.trim(),
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
