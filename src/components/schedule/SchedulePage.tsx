"use client";

import { useState } from "react";
import { useSchedule, DAYS } from "@/hooks/useSchedule";
import { AnimeCard } from "@/components/home/AnimeCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";

function getTodayKey(): string {
  const dayIndex = new Date().getDay(); // 0=Sunday
  return DAYS[dayIndex === 0 ? 6 : dayIndex - 1].key;
}

export function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(getTodayKey());
  const { data, isLoading, isError } = useSchedule(selectedDay);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-2xl font-bold text-foreground mb-2">Jadwal Anime</h1>
      <p className="text-sm text-muted mb-6">Anime tayang hari ini dan hari lainnya</p>

      {/* Day tabs */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {DAYS.map((day) => (
          <button
            key={day.key}
            onClick={() => setSelectedDay(day.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedDay === day.key
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} size="sm" />)}
        </div>
      )}

      {isError && (
        <EmptyState message="Gagal memuat jadwal." submessage="Coba lagi nanti." />
      )}

      {data && data.data.length === 0 && (
        <EmptyState
          message={`Tidak ada anime tayang hari ${DAYS.find((d) => d.key === selectedDay)?.label}.`}
          submessage="Pilih hari lain atau cek lagi nanti."
        />
      )}

      {data && data.data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.data.filter((a, i, arr) => arr.findIndex((x) => x.mal_id === a.mal_id) === i).map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
