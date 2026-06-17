import Link from "next/link";
import { Film } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-32 gap-4">
      <div className="h-20 w-20 rounded-full bg-surface flex items-center justify-center">
        <Film className="h-10 w-10 text-muted/30" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Halaman tidak ditemukan</h1>
      <p className="text-sm text-muted text-center max-w-sm">
        Anime yang kamu cari mungkin sudah tidak tersedia atau URL-nya salah.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
