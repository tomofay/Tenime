import { getTopAnime, getSeasonNow, getAnimeFull, getSeasonalAnime } from "../src/lib/jikan";
import { cacheAnimeData } from "../src/lib/anime-cache";
import { getCurrentSeason } from "../src/lib/season";

const CONCURRENCY = 2;
const startTime = Date.now();

function fmt(ms: number): string {
  const m = Math.floor(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}j ${m % 60}m` : `${m}m`;
}

async function collectIds(): Promise<number[]> {
  const ids = new Set<number>();
  const sources = [
    getTopAnime("airing"),
    getTopAnime("bypopularity"),
    getTopAnime("upcoming"),
    getSeasonNow(),
    (async () => {
      const { season, year } = getCurrentSeason();
      return getSeasonalAnime(year, season);
    })(),
  ];
  const results = await Promise.allSettled(sources);
  for (const r of results) {
    if (r.status === "fulfilled") for (const a of r.value) ids.add(a.mal_id);
  }
  return [...ids];
}

async function main() {
  console.log("🔍 Mengumpulkan ID anime populer/aktif dari Jikan...");
  const ids = await collectIds();
  console.log(`📥 ${ids.length} ID akan di-cache.\n`);

  let cached = 0;
  let failed = 0;
  let lastLog = Date.now();

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const res = await Promise.allSettled(
      batch.map((id) => getAnimeFull(id).then((a) => cacheAnimeData(id, a)))
    );
    for (const r of res) {
      if (r.status === "fulfilled") cached++;
      else failed++;
    }

    const now = Date.now();
    if (now - lastLog >= 2000 || i + CONCURRENCY >= ids.length) {
      lastLog = now;
      const pct = (((i + batch.length) / ids.length) * 100).toFixed(1);
      console.log(`  [${pct}%] ✅ ${cached} cached | ❌ ${failed} gagal`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n🎉 Selesai dalam ${fmt(Date.now() - startTime)}. Cached: ${cached}, Gagal: ${failed}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
