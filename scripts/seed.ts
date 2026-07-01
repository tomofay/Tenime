import { getAnimeFull } from "../src/lib/jikan";
import { cacheAnimeData } from "../src/lib/anime-cache";
import { JIKAN_BASE_URL } from "../src/lib/constants";

const START_ID = 1;
const MAX_PER_SEC = 3;
const CONCURRENT = 3;
const startTime = Date.now();

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
function formatETA(ms: number): string {
  if (ms < 0) return "0m";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

async function getLatestMalId(): Promise<number> {
  const res = await fetch(`${JIKAN_BASE_URL}/anime?order_by=mal_id&sort=desc&limit=1`);
  const json = await res.json() as { data: { mal_id: number }[] };
  return json.data[0]?.mal_id || 70000;
}

async function seed() {
  const endId = await getLatestMalId();
  const totalIds = endId - START_ID + 1;
  console.log(`🔍 Latest MAL ID: ${endId}`);
  console.log(`📥 Range: ${START_ID} → ${endId} (${totalIds.toLocaleString()} IDs)`);
  console.log(`⚡ ${MAX_PER_SEC}/s (${CONCURRENT} concurrent, 1s delay)`);
  console.log(`⏱️  ETA ~${formatETA((totalIds / MAX_PER_SEC) * 1000)}\n`);

  let cached = 0;
  let skipped = 0;
  let errors = 0;
  let lastLog = Date.now();

  for (let malId = START_ID; malId <= endId; malId += CONCURRENT) {
    const batch = [malId, malId + 1, malId + 2].filter((id) => id <= endId);

    const results = await Promise.allSettled(
      batch.map(async (id) => {
        try {
          const full = await getAnimeFull(id);
          await cacheAnimeData(id, full);
          return { id, title: full.title, ok: true };
        } catch (e: any) {
          if (e.message?.includes("404")) return { id, ok: false, reason: "404" };
          throw e;
        }
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        if (r.value.ok) cached++;
        else skipped++;
      } else {
        errors++;
      }
    }

    const now = Date.now();
    if (now - lastLog >= 2000) {
      lastLog = now;
      const done = cached + skipped + errors;
      const pct = ((malId - START_ID) / totalIds * 100).toFixed(1);
      const elapsed = now - startTime;
      const speed = done / (elapsed / 1000);
      const remaining = totalIds - (malId - START_ID);
      const eta = formatETA((remaining / MAX_PER_SEC) * 1000);
      const latest = results
        .filter((r) => r.status === "fulfilled" && r.value.ok)
        .map((r) => (r as PromiseFulfilledResult<{ title: string }>).value.title)
        .join(", ");

      console.log(`  [${pct}%] ID ${malId} | ✅ ${cached.toLocaleString()} cached | ⏭️ ${skipped.toLocaleString()} 404 | ❌ ${errors} | ⚡ ${speed.toFixed(1)}/s | ETA ${eta}`);
      if (latest) console.log(`         last: ${latest}`);
    }

    await delay(1000);
  }

  const totalTime = formatETA(Date.now() - startTime);
  console.log(`\n🎉 Done in ${totalTime}!`);
  console.log(`   Cached: ${cached.toLocaleString()} | 404: ${skipped.toLocaleString()} | Errors: ${errors}`);
  console.log(`📁 Posters saved to: public/cache/posters/anime-{malId}.webp`);
}

seed().catch(console.error);
