import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const status = {
    timestamp: new Date().toISOString(),
    db: "unhealthy",
    jikan: "unhealthy",
    otakudesu: "unhealthy",
  };

  try {
    await db.$queryRaw`SELECT 1`;
    status.db = "healthy";
  } catch { /* db unreachable */ }

  try {
    const res = await fetch("https://api.jikan.moe/v4/top/anime?limit=1", {
      signal: AbortSignal.timeout(5000),
    });
    status.jikan = res.ok ? "healthy" : "degraded";
  } catch { /* jikan unreachable */ }

  try {
    const res = await fetch("https://otakudesu.cloud/?s=test&post_type=anime", {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    status.otakudesu = res.ok ? "healthy" : "degraded";
  } catch { /* otakudesu unreachable */ }

  const allHealthy = Object.values(status).slice(1).every((v) => v === "healthy");
  return NextResponse.json(status, { status: allHealthy ? 200 : 503 });
}
