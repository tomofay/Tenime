"use client";

import { X, SlidersHorizontal } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { SearchInput } from "./SearchInput";
import { useFilterStore, type AnimeType, type AnimeStatus, type SortField } from "@/store/useFilterStore";

const animeTypes: { value: AnimeType; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Movie" },
  { value: "ova", label: "OVA" },
  { value: "special", label: "Special" },
  { value: "ona", label: "ONA" },
];

const animeStatuses: { value: AnimeStatus; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "airing", label: "Airing" },
  { value: "complete", label: "Complete" },
  { value: "upcoming", label: "Upcoming" },
];

const sortOptions: { value: SortField; label: string }[] = [
  { value: "", label: "Default" },
  { value: "score", label: "Score" },
  { value: "popularity", label: "Popularity" },
  { value: "title", label: "Title" },
  { value: "start_date", label: "Release Date" },
];

const popularGenres = [
  { id: 1, name: "Action" },
  { id: 2, name: "Adventure" },
  { id: 4, name: "Comedy" },
  { id: 8, name: "Drama" },
  { id: 10, name: "Fantasy" },
  { id: 14, name: "Horror" },
  { id: 18, name: "Mecha" },
  { id: 22, name: "Romance" },
  { id: 24, name: "Sci-Fi" },
  { id: 30, name: "Sports" },
  { id: 35, name: "Isekai" },
  { id: 36, name: "Slice of Life" },
  { id: 37, name: "Mystery" },
  { id: 41, name: "Thriller" },
];

const seasons = ["fall", "summer", "spring", "winter"] as const;
const currentYear = new Date().getFullYear();
const seasonOptions = (() => {
  const opts: { value: string; label: string }[] = [{ value: "", label: "Semua Season" }];
  for (let y = currentYear + 1; y >= 1917; y--) {
    for (const s of seasons) {
      const label = s.charAt(0).toUpperCase() + s.slice(1);
      opts.push({ value: `${y}-${s}`, label: `${label} ${y}` });
    }
  }
  return opts;
})();

export function FilterSheet() {
  const open = useUIStore((s) => s.mobileFilterOpen);
  const setOpen = useUIStore((s) => s.setMobileFilterOpen);

  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const genres = useFilterStore((s) => s.genres);
  const sort = useFilterStore((s) => s.sort);
  const sortDirection = useFilterStore((s) => s.sortDirection);
  const seasonValue = useFilterStore((s) => s.seasonValue);

  const setType = useFilterStore((s) => s.setType);
  const setStatus = useFilterStore((s) => s.setStatus);
  const toggleGenre = useFilterStore((s) => s.toggleGenre);
  const setSort = useFilterStore((s) => s.setSort);
  const setSortDirection = useFilterStore((s) => s.setSortDirection);
  const setSeasonValue = useFilterStore((s) => s.setSeasonValue);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-background border-t border-border px-4 py-4 animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="text-xs text-accent"
            >
              Reset
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SearchInput />

          {/* Type */}
          <div>
            <h3 className="text-xs font-medium text-muted mb-2">Tipe</h3>
            <div className="flex flex-wrap gap-1.5">
              {animeTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`rounded-md px-3 py-1 text-xs ${
                    type === t.value
                      ? "bg-accent text-white"
                      : "bg-surface text-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-xs font-medium text-muted mb-2">Status</h3>
            <div className="flex flex-wrap gap-1.5">
              {animeStatuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`rounded-md px-3 py-1 text-xs ${
                    status === s.value
                      ? "bg-accent text-white"
                      : "bg-surface text-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div>
            <h3 className="text-xs font-medium text-muted mb-2">Season</h3>
            <select
              value={seasonValue}
              onChange={(e) => setSeasonValue(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {seasonOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-xs font-medium text-muted mb-2">Genre</h3>
            <div className="flex flex-wrap gap-1.5">
              {popularGenres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`rounded-md px-2.5 py-1 text-xs ${
                    genres.includes(genre.id)
                      ? "bg-accent text-white"
                      : "bg-surface text-muted"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <h3 className="text-xs font-medium text-muted mb-2">Urutkan</h3>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortField)}
                className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {sort && (
                <button
                  onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                  }
                  className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted"
                >
                  {sortDirection === "asc" ? "↑" : "↓"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
