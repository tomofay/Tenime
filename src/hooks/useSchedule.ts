import { useQuery } from "@tanstack/react-query";
import type { Anime, Pagination } from "@/types/anime";

interface ScheduleResponse {
  data: Anime[];
  pagination: Pagination;
}

const DAYS = [
  { key: "monday", label: "Senin" },
  { key: "tuesday", label: "Selasa" },
  { key: "wednesday", label: "Rabu" },
  { key: "thursday", label: "Kamis" },
  { key: "friday", label: "Jumat" },
  { key: "saturday", label: "Sabtu" },
  { key: "sunday", label: "Minggu" },
] as const;

export function useSchedule(day: string) {
  return useQuery<ScheduleResponse>({
    queryKey: ["schedule", day],
    queryFn: () => fetch(`/api/anime/schedule?day=${day}`).then((r) => r.json()),
    staleTime: 30 * 60 * 1000,
    enabled: !!day,
  });
}

export { DAYS };
