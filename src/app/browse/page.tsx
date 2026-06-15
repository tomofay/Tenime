import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseContent } from "@/components/browse/BrowseContent";

export const metadata: Metadata = {
  title: "Browse Anime",
  description:
    "Cari dan filter anime subtitle Indonesia. Browse berdasarkan genre, tipe, status, dan musim.",
};

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  );
}
