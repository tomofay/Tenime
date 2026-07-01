"use client";

import { useRef, useCallback } from "react";
import type { ReactNode } from "react";

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
        <div className="col-span-full flex justify-center py-4">
          <p className="text-xs text-muted">Scroll lagi untuk melanjutkan.</p>
        </div>
      )}
    </>
  );
}
