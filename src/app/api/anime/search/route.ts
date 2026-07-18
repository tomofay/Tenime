import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { JIKAN_BASE_URL } from "@/lib/constants";
import { toCardWithLocalPoster } from "@/lib/poster";

function isNsfwRecord(a: Record<string, unknown>): boolean {
  const rating = ((a.rating as string) || "").toLowerCase();
  if (rating.includes("rx") || rating.includes("hentai")) return true;
  const explicit = a.explicit_genres as Array<{ name?: string }> | undefined;
  if (explicit && explicit.length > 0) return true;
  return false;
}

function filterNsfw(list: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return list.filter((a) => !isNsfwRecord(a));
}

async function fetchJikanWithRetry(url: string, attempt = 0): Promise<Response | null> {
  const MAX = 2;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    clearTimeout(timeout);
    if (res.ok) return res;
    // Retry on transient failures (429 rate limit, 5xx, 504 gateway)
    if (attempt < MAX && (res.status === 429 || res.status >= 500)) {
      const backoff = res.status === 429 ? 1000 * (attempt + 1) : 600 * (attempt + 1);
      await new Promise((r) => setTimeout(r, backoff));
      return fetchJikanWithRetry(url, attempt + 1);
    }
    return res;
  } catch {
    if (attempt < MAX) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      return fetchJikanWithRetry(url, attempt + 1);
    }
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") || undefined;
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const genres = searchParams.get("genres") || undefined;
  const rawOrderBy = searchParams.get("order_by") || undefined;
  const sort = searchParams.get("sort") || undefined;
  const page = Number(searchParams.get("page") || "1");

  // Map order_by: "popularity" → "members" (Jikan's equivalent)
  const order_by = rawOrderBy === "popularity" ? "members" : rawOrderBy;

  // Build Jikan params
  const jikanParams = new URLSearchParams();
  if (query) jikanParams.set("q", query);
  if (type) jikanParams.set("type", type);
  if (status) jikanParams.set("status", status);
  if (genres) jikanParams.set("genres", genres);
  if (order_by) jikanParams.set("order_by", order_by);
  if (sort) jikanParams.set("sort", sort);
  jikanParams.set("page", String(page));
  jikanParams.set("sfw", "true");

  // Try Jikan first
  let usedJikan = false;
  try {
    const url = `${JIKAN_BASE_URL}/anime?${jikanParams.toString()}`;
    const res = await fetchJikanWithRetry(url);

    if (res && res.ok) {
      usedJikan = true;
      const json = await res.json();
      console.log(`[api/anime/search] Jikan OK: ${json.data?.length || 0} results`);
      if (json.data?.length > 0) {
        const items = json.data as Array<{ mal_id: number; [key: string]: unknown }>;
        Promise.allSettled(
          items.map((anime) =>
            db.cachedAnime.upsert({
              where: { malId: anime.mal_id },
              update: { data: anime as object },
              create: { malId: anime.mal_id, data: anime as object },
            }).catch(() => {})
          )
        );
      }
      const safeData = filterNsfw((json.data as Array<Record<string, unknown>>) ?? []);
      return NextResponse.json({ ...json, data: safeData.map(toCardWithLocalPoster) });
    }

    if (res) {
      console.warn(`[api/anime/search] Jikan responded ${res.status}, falling back to cache`);
    } else {
      console.warn("[api/anime/search] Jikan unreachable after retries, falling back to cache");
    }
  } catch (e) {
    console.warn("[api/anime/search] Primary Jikan failed:", (e as Error).message);
  }

  // Fallback 1: top/anime (more reliable Jikan endpoint) — only when we have a filter, not for plain text search
  if (!usedJikan && !query) {
    try {
      const filter = order_by === "members"
        ? "bypopularity"
        : status === "upcoming" ? "upcoming"
        : status === "airing" ? "airing"
        : order_by === "score" ? "airing"
        : undefined;
      if (filter) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${JIKAN_BASE_URL}/top/anime?filter=${filter}&page=${page}${query ? `&q=${encodeURIComponent(query)}` : ""}`, {
          signal: controller.signal,
          headers: { "Accept": "application/json" },
        });
        clearTimeout(timeout);

        if (res.ok) {
          usedJikan = true;
          const json = await res.json();
          if (json.data?.length > 0) {
            const items = json.data as Array<{ mal_id: number; [key: string]: unknown }>;
            Promise.allSettled(
              items.map((anime) =>
                db.cachedAnime.upsert({
                  where: { malId: anime.mal_id },
                  update: { data: anime as object },
                  create: { malId: anime.mal_id, data: anime as object },
                }).catch(() => {})
              )
            );
          }
          return NextResponse.json({
            data: filterNsfw((json.data as Array<Record<string, unknown>>) ?? []).map(toCardWithLocalPoster),
            pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: json.data?.length || 0, total: json.data?.length || 0, per_page: 25 } },
          });
        }
      }
    } catch (e) {
      console.warn("[api/anime/search] Fallback Jikan also failed:", (e as Error).message);
    }
  }

  // Final fallback: search DB cache
  try {
    const allCached = await db.cachedAnime.findMany({
      select: { malId: true, data: true },
      orderBy: { updatedAt: "desc" },
    });

    const typeFilter = type;
    const statusFilter = status;
    const queryFilter = query?.toLowerCase();
    const genreIds = genres ? genres.split(",").map(Number) : [];

    let results = filterNsfw(allCached.map((c) => c.data as Record<string, unknown>));

    if (queryFilter) {
      results = results.filter((a) =>
        ((a.title as string) || "").toLowerCase().includes(queryFilter)
      );
    }
    if (typeFilter) {
      results = results.filter((a) => (a.type as string)?.toLowerCase() === typeFilter);
    }
    if (statusFilter) {
      results = results.filter((a) => {
        const s = (a.status as string)?.toLowerCase() || "";
        if (statusFilter === "airing") return s === "currently airing";
        if (statusFilter === "complete") return s === "finished airing";
        if (statusFilter === "upcoming") return s === "not yet aired";
        return false;
      });
    }
    if (genreIds.length > 0) {
      results = results.filter((a) => {
        const gs = (a.genres as Array<{ mal_id: number }>) || [];
        const ids = gs.map((g) => g.mal_id);
        return genreIds.some((gid) => ids.includes(gid));
      });
    }

    // Sort
    if (order_by === "score") {
      results.sort((a, b) => ((b.score as number) || 0) - ((a.score as number) || 0));
    } else if (order_by === "title") {
      results.sort((a, b) => ((a.title as string) || "").localeCompare((b.title as string) || ""));
    } else if (order_by === "start_date") {
      results.sort((a, b) => {
        const da = a.aired as { from?: string } | undefined;
        const db = b.aired as { from?: string } | undefined;
        const aa = da?.from || "0000";
        const bb = db?.from || "0000";
        return sort === "asc" ? aa.localeCompare(bb) : bb.localeCompare(aa);
      });
    }

    if (sort === "asc" && order_by !== "title") results.reverse();

    const total = results.length;
    const pageSize = 25;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);
    const hasNextPage = start + pageSize < total;

    // If Jikan was unreachable and the cache has no results, signal a retry
    // instead of pretending the search found nothing.
    if (!usedJikan && total === 0) {
      return NextResponse.json(
        {
          data: [],
          pagination: { last_visible_page: 0, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: 25 } },
          error: "source_unavailable",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      data: paged.map(toCardWithLocalPoster),
      pagination: {
        last_visible_page: Math.ceil(total / pageSize),
        has_next_page: hasNextPage,
        current_page: page,
        items: { count: paged.length, total, per_page: pageSize },
      },
    });
  } catch (e) {
    console.error("[api/anime/search] DB fallback failed:", e);
    return NextResponse.json({
      data: [],
      pagination: { last_visible_page: 0, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: 25 } },
    });
  }
}
