import { create } from "zustand";

export type AnimeType = "tv" | "movie" | "ova" | "special" | "ona" | "";
export type AnimeStatus = "airing" | "complete" | "upcoming" | "";
export type SortField =
  | "score"
  | "popularity"
  | "title"
  | "start_date"
  | "";
export type SortDirection = "asc" | "desc";

interface FilterState {
  query: string;
  type: AnimeType;
  status: AnimeStatus;
  genres: number[];
  season: string;
  year: string;
  sort: SortField;
  sortDirection: SortDirection;
  page: number;

  setQuery: (query: string) => void;
  setType: (type: AnimeType) => void;
  setStatus: (status: AnimeStatus) => void;
  toggleGenre: (genreId: number) => void;
  setGenres: (genres: number[]) => void;
  setSeason: (season: string) => void;
  setYear: (year: string) => void;
  setSort: (sort: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  query: "",
  type: "",
  status: "",
  genres: [],
  season: "",
  year: "",
  sort: "",
  sortDirection: "desc",
  page: 1,

  setQuery: (query) => set({ query, page: 1 }),
  setType: (type) => set({ type, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  toggleGenre: (genreId) =>
    set((state) => ({
      genres: state.genres.includes(genreId)
        ? state.genres.filter((g) => g !== genreId)
        : [...state.genres, genreId],
      page: 1,
    })),
  setGenres: (genres) => set({ genres, page: 1 }),
  setSeason: (season) => set({ season, page: 1 }),
  setYear: (year) => set({ year, page: 1 }),
  setSort: (sort) => set({ sort }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  setPage: (page) => set({ page }),
  resetFilters: () =>
    set({
      query: "",
      type: "",
      status: "",
      genres: [],
      season: "",
      year: "",
      sort: "",
      sortDirection: "desc",
      page: 1,
    }),
}));
