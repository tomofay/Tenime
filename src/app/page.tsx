import type { Metadata } from "next";
import { HomePageClient } from "@/components/home/HomePageClient";

export const metadata: Metadata = {
  title: "Tenime — Streaming Anime Sub Indo",
  description:
    "Nonton anime subtitle Indonesia gratis, tanpa iklan pop-up. UI modern, ringan, dan cepat.",
  openGraph: {
    title: "Tenime — Streaming Anime Sub Indo",
    description:
      "Nonton anime subtitle Indonesia gratis, tanpa iklan pop-up.",
    type: "website",
  },
};

export const revalidate = 300;

export default function Home() {
  return <HomePageClient />;
}
