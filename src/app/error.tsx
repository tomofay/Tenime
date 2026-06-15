"use client";

export default function ErrorPage({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-32">
      <h1 className="text-4xl font-bold text-foreground">Oops!</h1>
      <p className="mt-4 text-lg text-muted text-center max-w-md">
        Terjadi kesalahan. Silakan coba lagi nanti.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
      >
        Coba Lagi
      </button>
    </main>
  );
}
