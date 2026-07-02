"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

interface BatchDownloadButtonProps {
  malId: number;
  animeTitle: string;
  totalEpisodes: number;
}

export function BatchDownloadButton({ malId, animeTitle, totalEpisodes }: BatchDownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0 });

  async function downloadEpisode(ep: number, quality = "720p"): Promise<"ok" | "fail"> {
    try {
      const streamRes = await fetch(`/api/stream?malId=${malId}&ep=${ep}&title=${encodeURIComponent(animeTitle)}`);
      if (!streamRes.ok) return "fail";
      const streamData = await streamRes.json();
      const downloadGroups = streamData.downloadGroups || [];

      if (downloadGroups.length === 0) return "fail";

      const dlRes = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ malId, episodeNumber: ep, animeTitle, quality, downloadGroups }),
      });

      if (dlRes.status === 429) { await new Promise((r) => setTimeout(r, 10000)); return "fail"; }
      const dlData = await dlRes.json();

      if (dlData.success && dlData.streamUrl) {
        window.open(dlData.streamUrl, "_blank");
        return "ok";
      }
      return "fail";
    } catch {
      return "fail";
    }
  }

  async function downloadAll() {
    if (status === "downloading" || totalEpisodes <= 0) return;
    setStatus("downloading");
    setProgress({ current: 0, total: totalEpisodes, failed: 0 });

    let failed = 0;
    for (let ep = 1; ep <= totalEpisodes; ep++) {
      setProgress((p) => ({ ...p, current: ep }));
      const result = await downloadEpisode(ep);
      if (result === "fail") failed++;
      setProgress((p) => ({ ...p, failed }));
      if (ep < totalEpisodes) {
        await new Promise((r) => setTimeout(r, result === "fail" ? 15000 : 4000));
      }
    }
    setStatus("done");
  }

  const succeed = Math.max(0, progress.total - progress.failed);

  if (totalEpisodes <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "idle" && (
        <button onClick={downloadAll} className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors">
          <Download className="h-4 w-4" />
          Download Semua Episode (720p)
        </button>
      )}
      {status === "downloading" && (
        <div className="inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2">
          <Loader2 className="h-4 w-4 text-accent animate-spin" />
          <span className="text-sm text-accent">EP {progress.current}/{progress.total}{progress.failed > 0 && ` (${progress.failed} gagal)`}</span>
        </div>
      )}
      {status === "done" && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">{succeed} berhasil{progress.failed > 0 && `, ${progress.failed} gagal`}</span>
          </div>
          <button onClick={() => { setStatus("idle"); setProgress({ current: 0, total: 0, failed: 0 }); }} className="text-sm text-accent hover:underline">Ulangi</button>
        </div>
      )}
    </div>
  );
}
