import { JIKAN_BASE_URL } from "@/lib/constants";
import type { Anime, Episode, Pagination, AnimeCharacterSimple } from "@/types/anime";
import type { AnimeCharacterListResponse } from "@/types/anime";

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 350;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const waitTime = MIN_INTERVAL_MS - (now - lastRequestTime);
  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
  return fetch(url);
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export async function getTopAnime(filter: "airing" | "upcoming" | "bypopularity" = "airing", limit = 25): Promise<Anime[]> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/top/anime?filter=${filter}&limit=${limit}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: PaginatedResponse<Anime> = await res.json();
  return json.data;
}

export async function getSeasonNow(limit = 25): Promise<Anime[]> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/seasons/now?limit=${limit}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: PaginatedResponse<Anime> = await res.json();
  return json.data;
}

export async function getSeasonalAnime(year: number, season: string, limit = 25): Promise<Anime[]> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/seasons/${year}/${season}?limit=${limit}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: PaginatedResponse<Anime> = await res.json();
  return json.data;
}

export async function getAnimeFull(id: number): Promise<Anime> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${id}/full`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: { data: Anime } = await res.json();
  return json.data;
}

export async function getAnimeEpisodes(id: number, page = 1): Promise<PaginatedResponse<Episode>> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${id}/episodes?page=${page}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getAnimeCharacters(id: number): Promise<AnimeCharacterSimple[]> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${id}/characters`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: AnimeCharacterListResponse = await res.json();
  return (json.data ?? []).map((entry) => ({
    mal_id: entry.character.mal_id,
    name: entry.character.name,
    role: entry.role,
    image_url: entry.character.images?.webp?.image_url || entry.character.images?.jpg?.image_url || "",
  }));
}

export async function getSchedules(day: string, page = 1, limit = 20): Promise<PaginatedResponse<Anime>> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/schedules?filter=${day}&sfw=true&kids=false&limit=${limit}&page=${page}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function searchAnime(query: string, page = 1, limit = 24): Promise<PaginatedResponse<Anime>> {
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function searchAnimeAdvanced(params: {
  query?: string; type?: string; status?: string; genres?: number[];
  order_by?: string; sort?: string; page?: number; limit?: number;
}): Promise<PaginatedResponse<Anime>> {
  const sp = new URLSearchParams();
  if (params.query) sp.set("q", params.query);
  if (params.type) sp.set("type", params.type);
  if (params.status) sp.set("status", params.status);
  if (params.genres?.length) sp.set("genres", params.genres.join(","));
  if (params.order_by) sp.set("order_by", params.order_by);
  if (params.sort) sp.set("sort", params.sort);
  sp.set("page", String(params.page ?? 1));
  sp.set("limit", String(params.limit ?? 24));
  const res = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime?${sp.toString()}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}
