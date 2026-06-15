"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";
import { useFilterStore, type AnimeType, type AnimeStatus, type SortField } from "@/store/useFilterStore";
import { FilterSidebar } from "@/components/browse/FilterSidebar";
import { FilterSheet } from "@/components/browse/FilterSheet";
import { AnimeGrid } from "@/components/browse/AnimeGrid";
import { SlidersHorizontal } from "lucide-react";

export function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toggleMobileFilter = useUIStore((s) => s.toggleMobileFilter);
  const initialized = useRef(false);

  const query = useFilterStore((s) => s.query);
  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const genres = useFilterStore((s) => s.genres);
  const sort = useFilterStore((s) => s.sort);
  const sortDirection = useFilterStore((s) => s.sortDirection);
  const setQuery = useFilterStore((s) => s.setQuery);
  const setType = useFilterStore((s) => s.setType);
  const setStatus = useFilterStore((s) => s.setStatus);
  const setGenres = useFilterStore((s) => s.setGenres);
  const setSort = useFilterStore((s) => s.setSort);
  const setSortDirection = useFilterStore((s) => s.setSortDirection);

  // Sync URL → State on mount (only once)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const q = searchParams.get("q");
    const t = searchParams.get("type");
    const s = searchParams.get("status");
    const g = searchParams.get("genres");
    const sortParam = searchParams.get("sort");
    const dir = searchParams.get("dir");

    if (q !== null) setQuery(q);
    if (t) setType(t as AnimeType);
    if (s) setStatus(s as AnimeStatus);
    if (g) setGenres(g.split(",").map(Number).filter(Boolean));
    if (sortParam) setSort(sortParam as SortField);
    if (dir === "asc" || dir === "desc") setSortDirection(dir);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync State → URL on change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (genres.length > 0) params.set("genres", genres.join(","));
    if (sort) {
      params.set("sort", sort);
      params.set("dir", sortDirection);
    }

    const newUrl = params.toString()
      ? `/browse?${params.toString()}`
      : "/browse";
    router.replace(newUrl, { scroll: false });
  }, [query, type, status, genres, sort, sortDirection, router]);

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
      {/* Mobile filter button */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-foreground">
          Browse Anime
        </h1>
        <button
          onClick={toggleMobileFilter}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Desktop heading */}
      <h1 className="hidden lg:block text-2xl font-bold text-foreground mb-6">
        Browse Anime
      </h1>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <FilterSidebar />
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimeGrid />
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <FilterSheet />
    </div>
  );
}
