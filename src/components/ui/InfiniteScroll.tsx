"use client";

import { useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";

interface InfiniteScrollProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  isError?: boolean;
  children: ReactNode;
}

export function InfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isError,
  children,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage || isError) return;
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, isError]
  );

  return (
    <>
      {children}
      <div ref={lastElementRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="col-span-full flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
      {isError && hasNextPage && (
        <div className="col-span-full flex flex-col items-center gap-2 py-4">
          <p className="text-xs text-muted">Gagal memuat halaman berikutnya.</p>
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground hover:text-foreground hover:border-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}
    </>
  );
}
