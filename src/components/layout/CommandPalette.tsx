"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

let openPalette: (() => void) | null = null;
export function triggerSearchPalette() {
  openPalette?.();
}

interface SearchResult {
  mal_id: number;
  title: string;
  type: string;
  episodes: number | null;
  score: number | null;
  year: number | null;
  images: { webp: { image_url: string } };
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    openPalette = () => { setOpen(true); };
    return () => { openPalette = null; };
  }, []);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setResults([]);
        setSelected(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=6&sfw=true`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data || []);
        }
      } catch {}
      setLoading(false);
    }, 300);
  }, [query]);

  const navigate = useCallback((item: SearchResult) => {
    setOpen(false);
    router.push(`/anime/${item.mal_id}`);
  }, [router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) { navigate(results[selected]); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={onKeyDown}
            placeholder="Cari anime... (tekan ↑↓ untuk navigasi)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50 outline-none"
          />
          <kbd className="text-[10px] text-muted/50 bg-black/20 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && <div className="px-4 py-6 text-center text-sm text-muted">Mencari...</div>}
          {!loading && results.length === 0 && query && (
            <div className="px-4 py-6 text-center text-sm text-muted">Tidak ada hasil.</div>
          )}
          {results.map((item, i) => (
            <button
              key={item.mal_id}
              onClick={() => navigate(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === selected ? "bg-accent/10" : "hover:bg-surface-hover"
              }`}
            >
              <div className="shrink-0 h-12 w-9 rounded overflow-hidden bg-black/30">
                {item.images?.webp?.image_url && (
                  <img src={item.images.webp.image_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted">{item.type}</span>
                  {item.year && <span className="text-[10px] text-muted">{item.year}</span>}
                  {item.score && <span className="text-[10px] text-yellow-400">★ {item.score.toFixed(1)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
