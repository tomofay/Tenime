"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-32 gap-4">
      <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Terjadi kesalahan</h1>
      <p className="text-sm text-muted text-center max-w-sm">
        Maaf, ada yang tidak beres. Coba muat ulang halaman atau kembali ke beranda.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </button>
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          Kembali ke Beranda →
        </Link>
      </div>
    </div>
  );
}
