"use client";

import { useState, useRef } from "react";
import { RotateCw } from "lucide-react";
import { useSchedule, DAYS } from "@/hooks/useSchedule";
import { AnimeCard } from "@/components/home/AnimeCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";

function getTodayKey(): string {
  const dayIndex = new Date().getDay(); // 0=Sunday
  return DAYS[dayIndex === 0 ? 6 : dayIndex - 1].key;
}

export function SchedulePage() {
  const todayKey = getTodayKey();
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const { data, isLoading, isError, refetch } = useSchedule(selectedDay);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + DAYS.length) % DAYS.length;
    setSelectedDay(DAYS[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Jadwal Anime</h1>
      <p className="text-sm text-muted mb-6">Anime tayang hari ini dan hari lainnya</p>

      {/* Day tabs */}
      <div
        role="tablist"
        aria-label="Hari penayangan"
        className="flex flex-wrap gap-1.5 mb-8"
      >
        {DAYS.map((day, i) => {
          const isToday = day.key === todayKey;
          const isSelected = selectedDay === day.key;
          return (
            <button
              key={day.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              aria-selected={isSelected}
              aria-current={isToday ? "true" : undefined}
              onClick={() => setSelectedDay(day.key)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 pressable-sm ${
                isSelected
                  ? "bg-accent text-white shadow-lg shadow-accent/25"
                  : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {day.label}
              {isToday && (
                <span
                  className={`absolute -top-1 -right-1 h-2 w-2 rounded-full motion-safe:animate-dot-in ${
                    isSelected ? "bg-white" : "bg-accent"
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="motion-safe:animate-state-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} size="sm" />)}
        </div>
      )}

      {isError && (
        <div className="motion-safe:animate-state-in flex flex-col items-center justify-center rounded-xl border border-border bg-surface/40 py-16 px-6 text-center">
          <p className="text-foreground text-sm font-medium">Gagal memuat jadwal.</p>
          <p className="text-muted text-xs mt-1 max-w-xs">Sumber data anime sedang sibuk. Coba lagi beberapa saat lagi.</p>
          <button
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <RotateCw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      )}

      {data && data.data.length === 0 && (
        <div className="motion-safe:animate-state-in">
          <EmptyState
            message={`Tidak ada anime tayang hari ${DAYS.find((d) => d.key === selectedDay)?.label}.`}
            submessage="Pilih hari lain atau cek lagi nanti."
          />
        </div>
      )}

      {data && data.data.length > 0 && (
        <div key={selectedDay} className="motion-safe:animate-grid-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.data.filter((a: { mal_id: number }, i: number, arr: { mal_id: number }[]) => arr.findIndex((x) => x.mal_id === a.mal_id) === i).map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
