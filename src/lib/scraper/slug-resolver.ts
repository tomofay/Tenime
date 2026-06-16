import { db } from "@/lib/db";
import { fetchWithRetry } from "./bypass";
import { parseAnimeDetail } from "./detail-parser";
import { OTAKUDESU_BASE_URL } from "@/lib/constants";

function tokenizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleToSlugCandidate(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function stripOtakudesuBoilerplate(text: string): string {
  return text
    .replace(/\(Episode\s*\d+\s*[-–]\s*\d+\)/gi, "")
    .replace(/Subtitle\s*Indonesia/gi, "")
    .replace(/Sub\s*Indo/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSeasonNumber(title: string): number | null {
  const patterns = [
    /\bs(\d+)\b/i,                      // "S2", "s3"
    /season\s*(\d+)/i,                   // "Season 2"
    /(\d+)(?:st|nd|rd|th)\s*season/i,     // "2nd Season"
    /\b(\d+)$/,                           // bare number at end: "Ken 2"
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) return parseInt(m[1]);
  }
  return null;
}

async function searchAndFindAnimeUrl(jikanTitle: string): Promise<string | null> {
  const cheerioModule = await import("cheerio");

  const searchQueries = [
    jikanTitle,
    tokenizeTitle(jikanTitle).replace(/(\d+)(st|nd|rd|th)\s+Season/, "Season $1"),
    tokenizeTitle(jikanTitle).split(" ").slice(0, 4).join(" "),
  ];

  const deduped = [...new Set(searchQueries)];

  for (const query of deduped) {
    const encoded = encodeURIComponent(query);
    const searchUrl = `${OTAKUDESU_BASE_URL}/?s=${encoded}&post_type=anime`;

    try {
      const html = await fetchWithRetry(searchUrl);
      const $ = cheerioModule.load(html);

      const candidates: { url: string; text: string; score: number }[] = [];
      const jikanSeason = extractSeasonNumber(jikanTitle);

      $("a[href*='/anime/']").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        if (href && href.match(/\/anime\/[^/]+\/$/)) {
          const cleanText = stripOtakudesuBoilerplate(text);
          const titleTokens = tokenizeTitle(jikanTitle).split(" ");
          const textTokens = tokenizeTitle(cleanText).split(" ");

          // Score: jikan words appearing in text in ORDER (subsequence bonus)
          let seqIndex = 0;
          for (const tw of textTokens) {
            if (seqIndex < titleTokens.length && tw === titleTokens[seqIndex]) seqIndex++;
          }

          const matched = titleTokens.filter((t) => textTokens.includes(t)).length;
          const jikanWordCount = titleTokens.length || 1;
          const textWordCount = textTokens.length || 1;

          // Coverage: how many jikan words found
          const coverage = matched / jikanWordCount;
          // Sequence: how many consecutive jikan words matched in order
          const seqBonus = (seqIndex / jikanWordCount) * 3;
          // Extra words penalty: each extra word costs 0.5
          const extraPenalty = Math.max(0, textWordCount - jikanWordCount) * 0.5;

          let score = (coverage * 10) + seqBonus - extraPenalty;

          // Season number matching
          const textSeason = extractSeasonNumber(text);
          if (jikanSeason !== null && textSeason === jikanSeason) {
            score += 50;
          } else if (jikanSeason !== null && textSeason !== null && textSeason !== jikanSeason) {
            score -= 99;
          } else if (jikanSeason === null && textSeason !== null) {
            score -= 30;
          } else if (jikanSeason === null && textSeason === null) {
            score += 5;
          }

          candidates.push({ url: href, text, score });
        }
      });

      if (candidates.length > 0) {
        // Pick best match
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].url;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function resolveAnime(
  malId: number,
  jikanTitle: string
): Promise<{
  slug: string;
  episodes: { number: number; url: string; title: string }[];
}> {
  // 1. Check DB cache
  const cached = await db.animeSlugMapping.findUnique({
    where: { malId },
  });

  if (cached) {
    const ageMinutes =
      (Date.now() - cached.lastVerified.getTime()) / (1000 * 60);
    if (ageMinutes < 30) {
      try {
        const detailUrl = `${OTAKUDESU_BASE_URL}/anime/${cached.slug}/`;
        const html = await fetchWithRetry(detailUrl);
        const parsed = parseAnimeDetail(html);
        return { slug: cached.slug, episodes: parsed.episodes };
      } catch {
        // stale cache — re-resolve below
        console.warn(`[slug-resolver] Stale cache for malId=${malId}, slug=${cached.slug}`);
      }
    }
  }

  // 1.5 If title is garbage fallback, try to get real title from DB
  let effectiveTitle = jikanTitle;
  if (!effectiveTitle || effectiveTitle.startsWith("anime-")) {
    try {
      const animeData = await db.cachedAnime.findUnique({ where: { malId } });
      if (animeData) {
        const data = animeData.data as Record<string, unknown>;
        effectiveTitle = (data.title as string) || jikanTitle;
      }
    } catch { /* continue with fallback */ }
  }

  // 2. Search
  const detailUrl = await searchAndFindAnimeUrl(jikanTitle);

  if (!detailUrl) {
    throw new Error(
      `Failed to resolve Otakudesu URL for "${jikanTitle}"`
    );
  }

  const html = await fetchWithRetry(detailUrl);
  const parsed = parseAnimeDetail(html);

  const slugMatch = detailUrl.match(/\/anime\/([^/]+)\/?$/);
  const slug = slugMatch ? slugMatch[1] : `${titleToSlugCandidate(jikanTitle)}-sub-indo`;

  try {
    await db.animeSlugMapping.upsert({
      where: { malId },
      update: { slug, title: parsed.title, lastVerified: new Date() },
      create: { malId, slug, title: parsed.title },
    });
  } catch {
    // slug collision — another MAL ID has same slug, or record doesn't exist
    // Delete conflicting record if exists, then insert fresh
    try {
      await db.animeSlugMapping.upsert({
        where: { malId },
        update: { slug, title: parsed.title, lastVerified: new Date() },
        create: { malId, slug, title: parsed.title },
      });
    } catch {
      // Final fallback: delete by slug, then create
      try { await db.animeSlugMapping.deleteMany({ where: { slug } }); } catch {}
      await db.animeSlugMapping.create({
        data: { malId, slug, title: parsed.title, lastVerified: new Date() },
      });
    }
  }

  return { slug, episodes: parsed.episodes };
}
