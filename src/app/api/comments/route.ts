import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { commentCreateSchema, commentQuerySchema, commentDeleteSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/api-utils";

const COMMENT_LIMIT = { windowMs: 60_000, maxRequests: 20 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = commentQuerySchema.safeParse({
    malId: searchParams.get("malId"),
    ep: searchParams.get("ep"),
    limit: searchParams.get("limit") || "50",
    offset: searchParams.get("offset") || "0",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { malId, ep, limit, offset } = parsed.data;

  const comments = await db.comment.findMany({
    where: { malId, episodeNumber: ep },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  return NextResponse.json(comments);
}

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, COMMENT_LIMIT);
  if (rateLimit) return rateLimit;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = commentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { malId, episodeNumber, body: bodyText } = parsed.data;

  const comment = await db.comment.create({
    data: {
      userId: session.user.id,
      malId,
      episodeNumber,
      body: bodyText.trim(),
    },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = commentDeleteSchema.safeParse({ id: searchParams.get("id") });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment id" }, { status: 400 });
  }

  const comment = await db.comment.findUnique({ where: { id: parsed.data.id } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.comment.delete({ where: { id: parsed.data.id } });

  return NextResponse.json({ success: true });
}
