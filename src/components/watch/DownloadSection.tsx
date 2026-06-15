"use client";

import { Download, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Mirror } from "@/types/stream";

interface DownloadSectionProps {
  mirrors: Mirror[];
  malId: number;
  episode: number;
  quality?: string;
}

export function DownloadSection({ mirrors, malId, episode, quality = "720p" }: DownloadSectionProps) {
  const [status, setStatus] = useState<"checking" | "local" | "online" | "downloading">("checking");
  const [error, setError] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const r = await fetch(`/api/download?malId=${malId}&ep=${episode}`);
      const d = await r.json();
      setStatus(d.downloaded ? "local" : "online");
    } catch {
      setStatus("online");
    }
  }, [malId, episode]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  async function startDownload() {
    const acefile = mirrors.find((m) => m.name === "Acefile");
    const megaDownload = mirrors.find((m) => m.name === "Mega");
    const otakuFiles = mirrors.find((m) => m.name === "OtakuFiles");
    const kraken = mirrors.find((m) => m.name === "Kraken");
    const target = acefile || megaDownload || otakuFiles || kraken;
    if (!target) {
      setError("Mirror download tidak tersedia");
      return;
    }

    setStatus("downloading");
    setError("");

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ malId, episodeNumber: episode, url: target.url, quality }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("local");
      } else {
        setStatus("online");
        setError(data.error || "Download gagal");
      }
    } catch {
      setStatus("online");
      setError("Network error");
    }
  }

  if (status === "checking") return null;

  return (
    <div className="mt-3">
      {status === "local" ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          <span className="text-sm text-green-400">Tersimpan di server — streaming offline mode</span>
        </div>
      ) : status === "downloading" ? (
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
          <Loader2 className="h-4 w-4 text-accent animate-spin shrink-0" />
          <span className="text-sm text-accent">Mendownload {quality} dari AceFile/Google Drive...</span>
        </div>
      ) : (
        <div className="rounded-lg bg-surface/50 border border-border px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-sm text-foreground">Episode belum tersimpan di server</span>
          </div>

          {mirrors.find((m) => m.name === "Acefile") && (
            <button
              onClick={startDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover px-3 py-1.5 text-sm font-medium text-white transition-colors"
            >
              <Download className="h-4 w-4" />
              Download {quality} Otomatis
            </button>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
