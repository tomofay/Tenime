import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/api-utils";

const STATUS_LIMIT = { windowMs: 60_000, maxRequests: 30 };

export async function POST(request: Request) {
  const rateLimit = withRateLimit(request, STATUS_LIMIT);
  if (rateLimit) return rateLimit;

  try {
    const body = await request.json();
    const malIds: number[] = Array.isArray(body?.malIds)
      ? (body.malIds as unknown[])
          .filter((n): n is number => Number.isInteger(n) && (n as number) > 0)
          .slice(0, 100)
      : [];

    if (malIds.length === 0) {
      return NextResponse.json({ results: {} });
    }

    const cached = await db.cachedAnime.findMany({
      where: { malId: { in: malIds } },
      select: { malId: true, data: true },
    });

    const results: Record<string, string> = {};
    for (const c of cached) {
      const data = c.data as Record<string, unknown>;
      const s = (data.status as string) || "";
      if (s) results[String(c.malId)] = s;
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: {} });
  }
}
