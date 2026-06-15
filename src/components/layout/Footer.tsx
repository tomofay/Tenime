import Link from "next/link";
import { Play } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-accent fill-accent" />
            <span className="text-sm font-semibold text-foreground">
              Tenime
            </span>
            <span className="text-xs text-muted hidden sm:inline">
              — Streaming Anime Subtitle Indonesia
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              href="/browse"
              className="hover:text-foreground transition-colors"
            >
              Browse
            </Link>
            <span className="text-border">|</span>
            <span>© {new Date().getFullYear()} Tenime</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-[11px] text-muted/60 leading-relaxed max-w-2xl mx-auto">
          aniwatch tidak menyimpan file video di servernya. Semua konten video
          di-embed dari server pihak ketiga. Jika kamu pemilik konten dan
          keberatan, hubungi kami untuk penurunan tautan.
        </p>
      </div>
    </footer>
  );
}
