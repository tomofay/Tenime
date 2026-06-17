import { useInfiniteQuery } from "@tanstack/react-query";
import { searchAnimeAdvanced, getSeasonalAnime } from "@/lib/jikan";
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
        return getSeasonalAnime(Number(year), season, 24 * pageParam).then((data) => ({
          data,
          pagination: {
            last_visible_page: 1,
            has_next_page: false,
            current_page: 1,
            items: { count: data.length, total: data.length, per_page: 24 },
          },
        }));
      }
      return searchAnimeAdvanced({
        query: query || undefined,
        type: type || undefined,
        status: status || undefined,
        genres: genres.length > 0 ? genres : undefined,
        order_by: sort || undefined,
        sort: sort ? sortDirection : undefined,
        page: pageParam,
        limit: 24,
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
  });
}
