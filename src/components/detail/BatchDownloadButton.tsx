"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, SkipForward } from "lucide-react";

interface BatchDownloadButtonProps {
  malId: number;
  animeTitle: string;
  totalEpisodes: number;
}

export function BatchDownloadButton({ malId, animeTitle, totalEpisodes }: BatchDownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0, skipped: 0 });

  async function downloadEpisode(ep: number, retries = 3): Promise<"ok" | "skip" | "fail"> {
    // Cek dulu — udah ada di lokal?
    try {
      const checkRes = await fetch(`/api/download?malId=${malId}&ep=${ep}`);
      const checkData = await checkRes.json();
      if (checkData.downloaded) {
        setProgress((p) => ({ ...p, skipped: p.skipped + 1 }));
        return "skip";
      }
    } catch {
      // lanjut — cek gagal berarti belum ada
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const streamRes = await fetch(
          `/api/stream?malId=${malId}&ep=${ep}&title=${encodeURIComponent(animeTitle)}`
        );
        const streamData = await streamRes.json();

        const acefile = streamData.mirrors?.find(
          (m: { name: string }) => m.name === "Acefile"
        );

        if (!acefile?.url) return "fail";

        const dlRes = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            malId,
            episodeNumber: ep,
            url: acefile.url,
            quality: "720p",
          }),
        });

        const dlData = await dlRes.json();
        if (dlData.success) return "ok";

        // Retry after delay
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch {
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    return "fail";
  }

  async function downloadAll() {
    if (status === "downloading") return;
    setStatus("downloading");
    setProgress({ current: 0, total: totalEpisodes, failed: 0, skipped: 0 });

    let failed = 0;
    let skipped = 0;

    for (let ep = 1; ep <= totalEpisodes; ep++) {
      setProgress((p) => ({ ...p, current: ep }));

      const result = await downloadEpisode(ep, 3);

      if (result === "fail") failed++;
      else if (result === "skip") skipped++;

      // Delay antar episode untuk hindari rate limit
      if (ep < totalEpisodes) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setProgress((p) => ({ ...p, failed }));
    setStatus("done");
  }

  const succeed = progress.total - progress.failed - progress.skipped;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "idle" && (
        <button
          onClick={downloadAll}
          className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Semua Episode (720p)
        </button>
      )}

      {status === "downloading" && (
        <div className="inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2">
          <Loader2 className="h-4 w-4 text-accent animate-spin" />
          <span className="text-sm text-accent">
            Ep {progress.current}/{progress.total}
            {progress.skipped > 0 && ` (${progress.skipped} skip)`}
          </span>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">
              {succeed} berhasil
              {progress.skipped > 0 && `, ${progress.skipped} skip`}
              {progress.failed > 0 && `, ${progress.failed} gagal`}
            </span>
          </div>
          <button
            onClick={() => { setStatus("idle"); setProgress({ current: 0, total: 0, failed: 0, skipped: 0 }); }}
            className="text-sm text-accent hover:underline"
          >
            Ulangi
          </button>
          {progress.failed > 0 && (
            <span className="text-xs text-muted">
              (yang gagal akan dicoba ulang)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
