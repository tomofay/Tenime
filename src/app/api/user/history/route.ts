import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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

  const { malId, animeTitle, posterUrl, episodeNumber, episodeTitle } =
    await request.json();

  if (!malId || !animeTitle || !episodeNumber) {
    return NextResponse.json(
      { error: "malId, animeTitle, and episodeNumber are required" },
      { status: 400 }
    );
  }

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
    },
    create: {
      userId: session.user.id,
      malId,
      animeTitle,
      posterUrl: posterUrl || null,
      episodeNumber,
      episodeTitle: episodeTitle || null,
      progressPercent: 100,
    },
  });

  return NextResponse.json(history);
}
