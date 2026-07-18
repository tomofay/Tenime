"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";
import { useFilterStore, type AnimeType, type AnimeStatus, type SortField } from "@/store/useFilterStore";
import { FilterSidebar } from "@/components/browse/FilterSidebar";
import { FilterSheet } from "@/components/browse/FilterSheet";
import { AnimeGrid } from "@/components/browse/AnimeGrid";
import { X, SlidersHorizontal } from "lucide-react";
import { GENRE_LIST } from "@/lib/constants";

export function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toggleMobileFilter = useUIStore((s) => s.toggleMobileFilter);
  const initialized = useRef(false);

  const query = useFilterStore((s) => s.query);
  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const genres = useFilterStore((s) => s.genres);
  const seasonValue = useFilterStore((s) => s.seasonValue);
  const sort = useFilterStore((s) => s.sort);
  const sortDirection = useFilterStore((s) => s.sortDirection);
  const setQuery = useFilterStore((s) => s.setQuery);
  const setType = useFilterStore((s) => s.setType);
  const setStatus = useFilterStore((s) => s.setStatus);
  const setGenres = useFilterStore((s) => s.setGenres);
  const setSort = useFilterStore((s) => s.setSort);
  const setSortDirection = useFilterStore((s) => s.setSortDirection);
  const setSeasonValue = useFilterStore((s) => s.setSeasonValue);
  const toggleGenre = useFilterStore((s) => s.toggleGenre);
  const resetFilters = useFilterStore((s) => s.resetFilters);

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
    const ssn = searchParams.get("season");
    const yr = searchParams.get("year");

    if (q !== null) setQuery(q);
    if (t) setType(t as AnimeType);
    if (s) setStatus(s as AnimeStatus);
    if (g) setGenres(g.split(",").map(Number).filter(Boolean));
    if (sortParam) setSort(sortParam as SortField);
    if (dir === "asc" || dir === "desc") setSortDirection(dir);
    if (ssn) setSeasonValue(ssn);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChips: { label: string; onClear: () => void }[] = [];
  if (query) activeChips.push({ label: `"${query}"`, onClear: () => setQuery("") });
  if (type) activeChips.push({ label: type.toUpperCase(), onClear: () => setType("") });
  if (status) activeChips.push({ label: status, onClear: () => setStatus("") });
  if (seasonValue) activeChips.push({ label: seasonValue, onClear: () => setSeasonValue("") });
  for (const id of genres) {
    const name = (GENRE_LIST as Record<string, string>)[String(id)] ?? `#${id}`;
    activeChips.push({ label: name, onClear: () => toggleGenre(id) });
  }

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
    if (seasonValue) params.set("season", seasonValue);

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
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
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
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-foreground whitespace-nowrap">
              {query ? `Hasil untuk "${query}"` : "Semua Anime"}
            </h2>
            {activeChips.length > 0 && (
              <button
                onClick={resetFilters}
                className="shrink-0 text-xs text-accent hover:text-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
              >
                Hapus filter
              </button>
            )}
          </div>

          {activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {activeChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={chip.onClear}
                  className="motion-safe:animate-chip-in inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  style={{ animationDelay: `${Math.min(i, 8) * 20}ms` }}
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <AnimeGrid />
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <FilterSheet />
    </div>
  );
}
