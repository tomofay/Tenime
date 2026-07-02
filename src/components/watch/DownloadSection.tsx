"use client";

import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Mirror {
  name: string;
  url: string;
}

interface DownloadGroup {
  format: "mp4" | "mkv";
  quality: "360p" | "480p" | "720p" | "1080p";
  mirrors: Mirror[];
}

interface DownloadSectionProps {
  downloadGroups?: DownloadGroup[];
  malId: number;
  episode: number;
  animeTitle?: string;
}

export function DownloadSection({ downloadGroups, malId, episode, animeTitle = "" }: DownloadSectionProps) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done" | "failed">("idle");
  const [error, setError] = useState("");

  async function handleDownload() {
    setStatus("downloading");
    setError("");
    try {
      const body: Record<string, unknown> = { malId, episodeNumber: episode, quality: "720p", animeTitle };
      if (downloadGroups && downloadGroups.length > 0) {
        body.downloadGroups = downloadGroups;
      }

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.streamUrl) {
        setStatus("done");
        toast.success("Download dimulai!");
        window.location.href = data.streamUrl;
      } else {
        setStatus("failed");
        setError(data.error || "Download gagal — semua metode sudah dicoba");
        toast.error(data.error || "Download gagal");
      }
    } catch {
      setStatus("failed");
      setError("Gagal menghubungi server download");
      toast.error("Gagal menghubungi server");
    }
  }

  return (
    <div className="mt-2">
      {status === "done" ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <span className="text-sm text-green-400">Download selesai</span>
          <button onClick={() => setStatus("idle")} className="text-xs text-green-400 hover:underline ml-auto">Download lagi</button>
        </div>
      ) : status === "downloading" ? (
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
          <Loader2 className="h-4 w-4 text-accent animate-spin shrink-0" />
          <span className="text-sm text-accent">Menyiapkan download...</span>
        </div>
      ) : status === "failed" ? (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
          <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white transition-colors">
            <Download className="h-4 w-4" />Coba Lagi
          </button>
        </div>
      ) : (
        <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors">
          <Download className="h-4 w-4" />Download 720p
        </button>
      )}
    </div>
  );
}
