import { useInfiniteQuery } from "@tanstack/react-query";
import { getSeasonalAnime } from "@/lib/jikan";
import { useFilterStore } from "@/store/useFilterStore";

export function useAnimeSearch() {
  const query = useFilterStore((s) => s.query);
  const type = useFilterStore((s) => s.type);
  const status = useFilterStore((s) => s.status);
  const genres = useFilterStore((s) => s.genres);
  const sort = useFilterStore((s) => s.sort);
  const sortDirection = useFilterStore((s) => s.sortDirection);
  const seasonValue = useFilterStore((s) => s.seasonValue);

  const parts = seasonValue ? seasonValue.split("-") : [];
  const season = parts[1] || "";
  const year = parts[0] || "";
  const isSeasonal = !!season && !!year;

  return useInfiniteQuery({
    queryKey: ["anime-search", query, type, status, genres, sort, sortDirection, season, year],
    queryFn: ({ pageParam = 1 }) => {
      if (isSeasonal) {
        return getSeasonalAnime(Number(year), season).then((data) => ({
          data,
          pagination: {
            last_visible_page: 1,
            has_next_page: false,
            current_page: 1,
            items: { count: data.length, total: data.length, per_page: 24 },
          },
        }));
      }

      // Use local proxy — falls back to DB cache when Jikan is down
      const sp = new URLSearchParams();
      if (query) sp.set("q", query);
      if (type) sp.set("type", type);
      if (status) sp.set("status", status);
      if (genres.length > 0) sp.set("genres", genres.join(","));
      if (sort) {
        sp.set("order_by", sort);
        sp.set("sort", sortDirection);
      }
      sp.set("page", String(pageParam));

      return fetch(`/api/anime/search?${sp.toString()}`).then((r) => {
        if (!r.ok) throw new Error(`Search failed: ${r.status}`);
        return r.json();
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination) return undefined;
      if (lastPage.pagination.has_next_page) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryDelay: 3000,
  });
}
