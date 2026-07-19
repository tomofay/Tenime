import type { Metadata } from "next";
import { db } from "@/lib/db";
import { isNsfw } from "@/lib/nsfw";
import { toCardWithLocalPoster } from "@/lib/poster";
import { AnimeDetailClient } from "@/components/detail/AnimeDetailClient";

async function getServerAnime(id: number): Promise<{ data: unknown; cached: boolean } | null> {
  try {
    const cached = await db.cachedAnime.findUnique({ where: { malId: id } });
    if (cached) {
      if (isNsfw(cached.data as never)) return null;
      return { data: toCardWithLocalPoster(cached.data as never), cached: true };
    }
  } catch {
    // DB unreachable — fall back to client fetch
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ malId: string }>;
}): Promise<Metadata> {
  const { malId } = await params;
  const id = Number(malId);

  let anime: any = null;
  const serverAnime = await getServerAnime(id);
  if (serverAnime) {
    anime = serverAnime.data;
  } else {
    try {
      const url = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/anime/${id}`
        : `http://localhost:3000/api/anime/${id}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        const json = await res.json();
        anime = json.data;
      }
    } catch {
      // ignore
    }
  }

  if (!anime) return { title: "Anime Detail" };

  return {
    title: `${anime.title} — Kicaunime`,
    description: anime.synopsis?.slice(0, 160) || `Streaming ${anime.title} subtitle Indonesia.`,
    openGraph: {
      title: anime.title,
      description: anime.synopsis?.slice(0, 160),
      images: anime.images?.webp?.large_image_url ? [{ url: anime.images.webp.large_image_url }] : [],
      type: "website",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ malId: string }> }) {
  const { malId } = await params;
  const id = Number(malId);
  const serverAnime = await getServerAnime(id);

  return (
    <AnimeDetailClient
      malId={id}
      initialData={serverAnime ? { data: serverAnime.data as never, cached: serverAnime.cached } : undefined}
    />
  );
}
