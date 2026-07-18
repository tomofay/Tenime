import type { Metadata } from "next";
import { AnimeDetailClient } from "@/components/detail/AnimeDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ malId: string }>;
}): Promise<Metadata> {
  const { malId } = await params;
  const id = Number(malId);

  try {
    const url = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/anime/${id}`
      : `http://localhost:3000/api/anime/${id}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: "Anime Detail" };
    const json = await res.json();
    const anime = json.data;
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
  } catch {
    return { title: "Anime Detail" };
  }
}

export default async function Page({ params }: { params: Promise<{ malId: string }> }) {
  const { malId } = await params;
  return <AnimeDetailClient malId={Number(malId)} />;
}
