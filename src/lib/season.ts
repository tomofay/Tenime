export function getCurrentSeason(now: Date = new Date()): { season: string; year: number } {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month <= 3) return { season: "winter", year };
  if (month <= 6) return { season: "spring", year };
  if (month <= 9) return { season: "summer", year };
  return { season: "fall", year };
}
