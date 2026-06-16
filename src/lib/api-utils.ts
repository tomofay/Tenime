import { NextResponse } from "next/server";
import { checkRateLimit, type RateLimitConfig } from "@/lib/rate-limit";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

export function withRateLimit(
  request: Request,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(request);
  const key = `rl:${request.method}:${ip}`;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: result.resetAt.toISOString() },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetAt.toISOString(),
        },
      }
    );
  }

  return null;
}
