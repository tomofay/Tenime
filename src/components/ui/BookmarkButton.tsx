"use client";

import { BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useBookmarks, useToggleBookmark } from "@/hooks/useBookmarks";

interface BookmarkButtonProps {
  malId: number;
  title: string;
  posterUrl?: string;
  score?: number;
  type?: string;
  status?: string;
  size?: "sm" | "md";
}

export function BookmarkButton({
  malId,
  title,
  posterUrl,
  score,
  type,
  status,
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

    toggleBookmark({ malId, title, posterUrl, score, type, status });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-md transition-colors ${
        isBookmarked
          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
          : "bg-surface text-muted hover:text-foreground"
      } ${size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
    >
      {isBookmarked ? (
        <BookmarkCheck className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
      ) : (
        <BookmarkPlus className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
      )}
      {isBookmarked ? "Watchlist" : "Tambah Watchlist"}
    </button>
  );
}
