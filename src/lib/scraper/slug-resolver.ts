import { db } from "@/lib/db";
import { fetchWithRetry } from "./bypass";
import { parseAnimeDetail } from "./detail-parser";
import { OTAKUDESU_BASE_URL, OTAKUDESU_FALLBACK_URLS } from "@/lib/constants";

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

function extractSeasonFromSlug(href: string): { season: number | null; part: number | null } {
  const s = href.match(/-s(\d+)-/i) || href.match(/-season-(\d+)-/i);
  const p = href.match(/-part-(\d+)-/i) || href.match(/-bagian-(\d+)-/i);
  return { season: s ? parseInt(s[1]) : null, part: p ? parseInt(p[1]) : null };
}

function extractSeasonNumber(title: string): number | null {
  const patterns = [
    /\bs(\d+)\b/i,
    /season\s*(\d+)/i,
    /(\d+)(?:st|nd|rd|th)\s*season/i,
    /\b([IVX]+)\b(?=\s*:|\s*-|\s*\(|$|\s+(?:sub\s*indo|subtitle|indonesia)?\s*$)/i,
    /\b(\d+)$/,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) {
      if (/^[IVX]+$/i.test(m[1])) {
        return ROMAN_TO_NUM[m[1].toUpperCase()] ?? null;
      }
      return parseInt(m[1]);
    }
  }
  return null;
}

function extractPartNumber(text: string): number | null {
  const m = text.match(/\bpart\s*(\d+)\b/i) || text.match(/\bbagian\s*(\d+)\b/i);
  return m ? parseInt(m[1]) : null;
}

const ROMAN_TO_NUM: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
};

// Convert trailing Roman-numeral season markers to "Season N", e.g.
// "Mushoku Tensei III" -> "Mushoku Tensei Season 3"
// Move a Roman-numeral season marker to the END as "Season N",
// matching Otakudesu's title format, e.g.
// "Mushoku Tensei III: Isekai Ittara Honki Dasu" ->
// "Mushoku Tensei : Isekai Ittara Honki Dasu Season 3"
function romanNumeralToSeason(title: string): string {
  const m = title.match(
    /\b([IVX]+)\b(?=\s*:|\s*-|\s*\(|\s*$|\s+(?:sub\s*indo|subtitle|indonesia)?\s*$)/i
  );
  if (!m) return title;
  const n = ROMAN_TO_NUM[m[1].toUpperCase()];
  if (!n) return title;
  const stripped = title.replace(m[0], "").replace(/\s{2,}/g, " ").trim();
  return `${stripped} Season ${n}`;
}

async function searchAndFindAnimeUrl(jikanTitle: string): Promise<string | null> {
  const cheerioModule = await import("cheerio");

  const baseTitle = tokenizeTitle(jikanTitle)
    .replace(/\d+(?:st|nd|rd|th)?\s*season/i, "")
    .replace(/\bs\d+\b/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const romanVariant = romanNumeralToSeason(jikanTitle);
  const romanVariantTok = romanNumeralToSeason(tokenizeTitle(jikanTitle));

  // Generate search queries: multiple phrasing of the same title
  const searchQueries = [
    jikanTitle,                                                                           // original: "Mushoku Tensei III: Isekai Ittara Honki Dasu"
    romanVariant,                                                                         // "Mushoku Tensei Season 3: Isekai Ittara Honki Dasu"
    romanVariantTok,                                                                      // "mushoku tensei season 3 isekai ittara honki dasu"
    tokenizeTitle(jikanTitle).replace(/(\d+)(st|nd|rd|th)\s+Season/i, "Season $1"),     // "tensei kizoku kantei skill de nariagaru Season 2"
    tokenizeTitle(jikanTitle).replace(/(\d+)(st|nd|rd|th)\s+Season/i, "season $1"),     // "tensei kizoku kantei skill de nariagaru season 2"
    baseTitle,                                                                             // "tensei kizoku kantei skill de nariagaru" (no season)
    baseTitle.split(" ").slice(0, 4).join(" "),                                           // first 4 words
  ];

  const deduped = [...new Set(searchQueries)];
  const allCandidates: { url: string; text: string; score: number }[] = [];
  const seenUrls = new Set<string>();
  const jikanSeason = extractSeasonNumber(jikanTitle);

  for (const query of deduped) {
    const encoded = encodeURIComponent(query);
    const searchUrl = `${OTAKUDESU_BASE_URL}/?s=${encoded}&post_type=anime`;

    try {
      console.log(`[slug-resolver] Searching: "${query}" → ${searchUrl}`);
      const html = await fetchWithRetry(searchUrl);
      const $ = cheerioModule.load(html);

      $("a[href*='/anime/']").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();
        if (!href || !href.match(/\/anime\/[^/]+\/$/)) return;
        if (seenUrls.has(href)) return;
        seenUrls.add(href);

        const cleanText = stripOtakudesuBoilerplate(text);
        const titleTokens = tokenizeTitle(jikanTitle).split(" ");
        const textTokens = tokenizeTitle(cleanText).split(" ");

        // Sequence bonus: jikan words appearing in text in ORDER
        let seqIndex = 0;
        for (const tw of textTokens) {
          if (seqIndex < titleTokens.length && tw === titleTokens[seqIndex]) seqIndex++;
        }

        const matched = titleTokens.filter((t) => textTokens.includes(t)).length;
        const jikanWordCount = titleTokens.length || 1;
        const textWordCount = textTokens.length || 1;

        const coverage = matched / jikanWordCount;
        const seqBonus = (seqIndex / jikanWordCount) * 3;
        const extraPenalty = Math.max(0, textWordCount - jikanWordCount) * 0.5;

        let score = (coverage * 10) + seqBonus - extraPenalty;

        // Season matching
        const textSeason = extractSeasonNumber(text);
        const textPart = extractPartNumber(text);
        const { season: slugSeason, part: slugPart } = extractSeasonFromSlug(href);

        // Otakudesu uses "Part 2" where Jikan says "Season 2"
        const effectiveTextSeason = textSeason ?? (jikanSeason !== null ? textPart : null);

        const seasonMatches = slugSeason === jikanSeason
          || effectiveTextSeason === jikanSeason
          || (slugPart !== null && slugPart === jikanSeason);
        const hasAnySeason = slugSeason ?? effectiveTextSeason ?? null;

        if (jikanSeason !== null && seasonMatches) {
          score += 80;
        } else if (jikanSeason !== null && hasAnySeason !== null && hasAnySeason !== jikanSeason) {
          score -= 99;
        } else if (jikanSeason !== null && hasAnySeason === null) {
          // neutral
        } else if (jikanSeason === null && hasAnySeason !== null) {
          score -= 30;
        } else {
          score += 5;
        }

        allCandidates.push({ url: href, text, score });
      });
    } catch (e) {
      console.warn(`[slug-resolver] Search failed for "${query}": ${(e as Error).message}`);
      continue;
    }
  }

  if (allCandidates.length > 0) {
    allCandidates.sort((a, b) => b.score - a.score);
    console.log(`[slug-resolver] Total candidates: ${allCandidates.length}`);

    for (let i = 0; i < Math.min(allCandidates.length, 5); i++) {
      const c = allCandidates[i];
      console.log(`[slug-resolver]   ${i + 1}. "${c.text}" (score=${c.score.toFixed(1)})`);
    }

    return allCandidates[0].url;
  }

  console.warn(`[slug-resolver] No candidates found across all queries for "${jikanTitle}"`);
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

    const jikanSeason = extractSeasonNumber(jikanTitle);
    const cachedSlugSeason = extractSeasonFromSlug(cached.slug);

    const cacheStillGood = ageMinutes < 30
      && (jikanSeason === null
          || cachedSlugSeason.season === jikanSeason
          || cachedSlugSeason.part === jikanSeason);

    if (cacheStillGood) {
      try {
        const detailUrl = `${OTAKUDESU_BASE_URL}/anime/${cached.slug}/`;
        const html = await fetchWithRetry(detailUrl);
        const parsed = parseAnimeDetail(html);
        return { slug: cached.slug, episodes: parsed.episodes };
      } catch {
        console.warn(`[slug-resolver] Stale cache for malId=${malId}, slug=${cached.slug}`);
      }
    } else {
      console.warn(`[slug-resolver] Cache invalidated for malId=${malId}, title="${jikanTitle}", cached slug="${cached.slug}"`);
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
  const detailUrl = await searchAndFindAnimeUrl(effectiveTitle);

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
    // slug collision
    try {
      await db.animeSlugMapping.upsert({
        where: { malId },
        update: { slug, title: parsed.title, lastVerified: new Date() },
        create: { malId, slug, title: parsed.title },
      });
    } catch {
      try { await db.animeSlugMapping.deleteMany({ where: { slug } }); } catch {}
      await db.animeSlugMapping.create({
        data: { malId, slug, title: parsed.title, lastVerified: new Date() },
      });
    }
  }

  return { slug, episodes: parsed.episodes };
}
