import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { watchHistoryCreateSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await db.watchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(history);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = watchHistoryCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { malId, animeTitle, posterUrl, episodeNumber, episodeTitle, progressPercent, progressSeconds } = parsed.data;

  const history = await db.watchHistory.upsert({
    where: {
      userId_malId_episodeNumber: {
        userId: session.user.id,
        malId,
        episodeNumber,
      },
    },
    update: {
      watchedAt: new Date(),
      episodeTitle: episodeTitle || null,
      posterUrl: posterUrl || null,
      progressPercent: progressPercent ?? 0,
      progressSeconds: progressSeconds ?? 0,
    },
    create: {
      userId: session.user.id,
      malId,
      animeTitle,
      posterUrl: posterUrl || null,
      episodeNumber,
      episodeTitle: episodeTitle || null,
      progressPercent: progressPercent ?? 0,
      progressSeconds: progressSeconds ?? 0,
    },
  });

  return NextResponse.json(history);
}
