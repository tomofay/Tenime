import type { Anime } from "@/types/anime";

export interface AnimeCardData {
  mal_id: number;
  title: string;
  images: { webp: { large_image_url: string } };
  score: number;
  episodes: number | null;
  type: string;
  airing?: boolean;
  synopsis?: string;
}

export function toAnimeCardData(item: {
  mal_id?: number;
  malId?: number;
  title: string;
  images?: { webp?: { large_image_url?: string } };
  poster?: string | null;
  score?: number | null;
  episodes?: number | null;
  episodeCount?: number | null;
  maxEpisode?: number | null;
  type?: string | null;
  airing?: boolean;
  synopsis?: string;
}): AnimeCardData {
  return {
    mal_id: item.mal_id ?? item.malId ?? 0,
    title: item.title,
    images: {
      webp: {
        large_image_url: item.images?.webp?.large_image_url ?? item.poster ?? "",
      },
    },
    score: item.score ?? 0,
    episodes: (item.episodes as number | null) ?? (item.episodeCount as number | null) ?? (item.maxEpisode as number | null) ?? null,
    type: (item.type as string) || "TV",
    airing: item.airing,
    synopsis: item.synopsis,
  };
}
