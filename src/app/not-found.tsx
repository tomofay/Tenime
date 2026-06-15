import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-32">
      <h1 className="text-6xl font-bold text-accent">404</h1>
      <p className="mt-4 text-lg text-muted">Halaman tidak ditemukan</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
      >
        ← Kembali ke Beranda
      </Link>
    </main>
  );
}
