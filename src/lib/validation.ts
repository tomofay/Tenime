import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter").max(30),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const bookmarkCreateSchema = z.object({
  malId: z.number().int().positive(),
  title: z.string().min(1),
  posterUrl: z.string().url().optional().nullable(),
  score: z.number().min(0).max(10).optional().nullable(),
  type: z.string().optional().nullable(),
});

export const bookmarkDeleteSchema = z.object({
  malId: z.coerce.number().int().positive(),
});

export const watchHistoryCreateSchema = z.object({
  malId: z.number().int().positive(),
  animeTitle: z.string().min(1),
  posterUrl: z.string().url().optional().nullable(),
  episodeNumber: z.number().int().positive(),
  episodeTitle: z.string().optional().nullable(),
});

export const downloadSchema = z.object({
  malId: z.number().int().positive(),
  episodeNumber: z.number().int().positive(),
  animeTitle: z.string().optional().default(""),
  url: z.string().url(),
  quality: z.string().optional().default("720p"),
});

export const downloadQuerySchema = z.object({
  malId: z.coerce.number().int().positive(),
  ep: z.coerce.number().int().positive(),
});

export const cacheAnimeSchema = z.object({
  malIds: z.array(z.number().int().positive()).max(25),
});

export const mirrorQuerySchema = z.object({
  id: z.coerce.number().int().positive(),
  i: z.coerce.number().int().min(0),
  q: z.string().min(1),
});

export const streamQuerySchema = z.object({
  malId: z.coerce.number().int().positive(),
  ep: z.coerce.number().int().positive(),
  title: z.string().optional(),
});

export const animeListQuerySchema = z.object({
  malId: z.coerce.number().int().positive(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>;
export type WatchHistoryCreateInput = z.infer<typeof watchHistoryCreateSchema>;
export type DownloadInput = z.infer<typeof downloadSchema>;
export type CacheAnimeInput = z.infer<typeof cacheAnimeSchema>;
