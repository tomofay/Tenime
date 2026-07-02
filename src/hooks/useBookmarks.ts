import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { Bookmark } from "@/types/user";

async function fetchBookmarks(): Promise<Bookmark[]> {
  const res = await fetch("/api/user/bookmarks");
  if (!res.ok) throw new Error("Failed to fetch bookmarks");
  return res.json();
}

export function useBookmarks() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["bookmarks", session?.user?.id],
    queryFn: fetchBookmarks,
    staleTime: 60 * 1000,
    enabled: !!session?.user?.id,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { data: bookmarks } = useBookmarks();

  return useMutation({
    mutationFn: async (item: {
      malId: number;
      title: string;
      posterUrl?: string;
      score?: number;
      type?: string;
      status?: string;
    }) => {
      const existing = bookmarks?.find((b) => b.malId === item.malId);
      if (existing) {
        const res = await fetch(
          `/api/user/bookmarks?malId=${item.malId}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to remove bookmark");
        return null;
      } else {
        const res = await fetch("/api/user/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error("Failed to add bookmark");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
