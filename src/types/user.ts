export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface Bookmark {
  id: string;
  userId: string;
  malId: number;
  title: string;
  posterUrl: string | null;
  score: number | null;
  type: string | null;
  status: string | null;
  createdAt: string;
}

export interface WatchHistory {
  id: string;
  userId: string;
  malId: number;
  animeTitle: string;
  posterUrl: string | null;
  episodeNumber: number;
  episodeTitle: string | null;
  progressPercent: number;
  watchedAt: string;
}
