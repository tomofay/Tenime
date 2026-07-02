"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { BookmarkGrid } from "@/components/dashboard/BookmarkGrid";
import { HistoryTimeline } from "@/components/dashboard/HistoryTimeline";
import { Bookmark, Clock, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";

type DashboardTab = "bookmarks" | "history";

export function DashboardClient() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<DashboardTab>("bookmarks");
  const { data: bookmarks } = useBookmarks();
  const { data: history } = useWatchHistory();

  const tabs: { key: DashboardTab; icon: typeof Bookmark; label: string }[] = [
    { key: "bookmarks", icon: Bookmark, label: "Watchlist" },
    { key: "history", icon: Clock, label: "History" },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="flex items-center gap-4 mb-8">
        <UserAvatar size="lg" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {session?.user?.name || "Dashboard"}
          </h1>
          <p className="text-sm text-muted">{session?.user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/edit"
            className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-sm text-muted hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.key === "bookmarks" && bookmarks && (
                <span className="rounded-full bg-surface px-1.5 py-0.5 text-xs">
                  {bookmarks.length}
                </span>
              )}
              {tab.key === "history" && history && (
                <span className="rounded-full bg-surface px-1.5 py-0.5 text-xs">
                  {history.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "bookmarks" && <BookmarkGrid bookmarks={bookmarks ?? []} />}
      {activeTab === "history" && <HistoryTimeline history={history ?? []} />}
    </div>
  );
}
