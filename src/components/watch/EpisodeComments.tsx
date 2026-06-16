"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  user: { id: string; username: string; avatarUrl: string | null };
}

interface EpisodeCommentsProps {
  malId: number;
  episodeNumber: number;
}

export function EpisodeComments({ malId, episodeNumber }: EpisodeCommentsProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: comments, isLoading } = useQuery<CommentItem[]>({
    queryKey: ["comments", malId, episodeNumber],
    queryFn: async () => {
      const res = await fetch(`/api/comments?malId=${malId}&ep=${episodeNumber}`);
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ malId, episodeNumber, body: text }),
    });
    if (res.ok) {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", malId, episodeNumber] });
    }
    setSending(false);
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Komentar ({comments?.length ?? 0})
        </h3>
      </div>

      {/* Comment input */}
      {session ? (
        <div className="flex gap-2 mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            placeholder="Tulis komentar..."
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="shrink-0 self-end rounded-lg bg-accent p-2 text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted mb-4">
          <a href="/auth/login" className="text-accent hover:underline">Login</a> untuk berkomentar.
        </p>
      )}

      {/* Comment list */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!isLoading && comments && comments.length === 0 && (
        <p className="text-xs text-muted py-4">Belum ada komentar. Jadilah yang pertama!</p>
      )}

      {comments && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-surface border border-border">
                <img
                  src={`/api/user/avatar/${c.user.id}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-accent text-white text-xs font-bold">
                  {c.user.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{c.user.username}</span>
                  <span className="text-[10px] text-muted/60">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
