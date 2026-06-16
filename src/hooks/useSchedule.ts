import { useQuery } from "@tanstack/react-query";
import { getSchedules } from "@/lib/jikan";

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
  return useQuery({
    queryKey: ["schedule", day],
    queryFn: () => getSchedules(day, 1, 20),
    staleTime: 30 * 60 * 1000,
    enabled: !!day,
  });
}

export { DAYS };
