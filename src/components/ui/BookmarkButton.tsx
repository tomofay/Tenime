"use client";

import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useBookmarks, useToggleBookmark } from "@/hooks/useBookmarks";

interface BookmarkButtonProps {
  malId: number;
  title: string;
  posterUrl?: string;
  score?: number;
  type?: string;
  size?: "sm" | "md";
}

export function BookmarkButton({
  malId,
  title,
  posterUrl,
  score,
  type,
  size = "md",
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: bookmarks } = useBookmarks();
  const { mutate: toggleBookmark, isPending } = useToggleBookmark();

  const isBookmarked = bookmarks?.some((b) => b.malId === malId);

  function handleClick() {
    if (!session) {
      router.push("/auth/login");
      return;
    }

    toggleBookmark({ malId, title, posterUrl, score, type });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-md transition-colors ${
        isBookmarked
          ? "bg-accent/10 text-accent hover:bg-accent/20"
          : "bg-surface text-muted hover:text-foreground"
      } ${size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
    >
      <Bookmark
        className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} ${
          isBookmarked ? "fill-accent" : ""
        }`}
      />
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
