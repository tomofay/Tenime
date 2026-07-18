import { getAnimeFull, getLatestMalId } from "../src/lib/jikan";
import { cacheAnimeData } from "../src/lib/anime-cache";
import { db } from "../src/lib/db";

const CONCURRENCY = Number(process.env.CONCURRENCY) || 3; // max 3 req/sec (Jikan limit)
const START_ID = Number(process.env.START_ID) || 1;
const BATCH_DELAY_MS = Number(process.env.BATCH_DELAY) || 1000; // 1s between batches -> ~3 req/sec
const startTime = Date.now();

function fmt(ms: number): string {
  if (ms < 0) return "0m";
  const m = Math.floor(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}j ${m % 60}m` : `${m}m`;
}

async function isCached(malId: number): Promise<boolean> {
  const r = await db.cachedAnime.findUnique({ where: { malId }, select: { malId: true } });
  return !!r;
}

async function main() {
  // Resolve the latest MAL id to know the upper bound
  let endId = START_ID;
  try {
    endId = await getLatestMalId();
  } catch {
    console.warn("⚠️ Gagal ambil latest MAL id, pakai batas manual via END_ID env (default 70000)");
    endId = Number(process.env.END_ID) || 70000;
  }

  const total = endId - START_ID + 1;
  console.log(`🔍 Full scrape Jikan: ${START_ID} → ${endId} (${total.toLocaleString()} ID)`);
  console.log(`⚡ Concurrency: ${CONCURRENCY} | batch delay: ${BATCH_DELAY_MS}ms (≈3 req/sec, sesuai batas Jikan)`);
  console.log(`♻️ Resumable: ID sudah di-cache akan dilewati\n`);

  let done = 0;
  let cached = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;
  let backoffUntil = 0;
  let lastLog = Date.now();

  for (let malId = START_ID; malId <= endId; malId += CONCURRENCY) {
    // Global backoff kalau kena rate-limit beruntun
    if (Date.now() < backoffUntil) {
      await new Promise((r) => setTimeout(r, backoffUntil - Date.now()));
    }

    const batch = Array.from(
      { length: CONCURRENCY },
      (_, i) => malId + i
    ).filter((id) => id <= endId);

    const results = await Promise.allSettled(
      batch.map(async (id) => {
        // Skip yang sudah ada di cache (resume)
        if (await isCached(id)) return { id, status: "skip" as const };
        const anime = await getAnimeFull(id);
        await cacheAnimeData(id, anime);
        return { id, status: "ok" as const };
      })
    );

    for (const r of results) {
      done++;
      if (r.status === "fulfilled") {
        if (r.value.status === "skip") skipped++;
        else cached++;
      } else {
        const msg = (r.reason as Error)?.message || "";
        if (msg.includes("404")) notFound++;
        else if (msg.includes("429")) {
          errors++;
          backoffUntil = Date.now() + 30_000; // backoff 30s
          console.warn("⏳ Rate-limit 429 — backoff 30s");
        } else {
          errors++;
        }
      }
    }

    const now = Date.now();
    if (now - lastLog >= 3000 || malId + CONCURRENCY > endId) {
      lastLog = now;
      const pct = ((done / total) * 100).toFixed(2);
      const elapsed = now - startTime;
      const speed = done / (elapsed / 1000);
      const remaining = total - done;
      const eta = speed > 0 ? fmt((remaining / speed) * 1000) : "?";
      console.log(
        `  [${pct}%] ID ${malId} | ✅ ${cached} | ⏭️ ${skipped} skip | ❌404 ${notFound} | ⚠️ ${errors} | ${speed.toFixed(1)}/s | ETA ${eta}`
      );
    }

    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }

  console.log(`\n🎉 Selesai dalam ${fmt(Date.now() - startTime)}`);
  console.log(`   Cached: ${cached.toLocaleString()} | Skip: ${skipped.toLocaleString()} | 404: ${notFound.toLocaleString()} | Errors: ${errors.toLocaleString()}`);
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
