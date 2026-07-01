"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, CheckCircle2, X, Search, Film, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface AnimeResult {
  mal_id: number;
  title: string;
  images: { webp: { large_image_url: string } };
  type?: string;
  episodes?: number;
}

interface FileEntry {
  id: number;
  file: File;
  ep: string;
  quality: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

let uid = 0;

export function ManualUploadForm() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AnimeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<AnimeResult | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [globalQuality, setGlobalQuality] = useState("720p");
  const [uploadingAll, setUploadingAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<number | undefined>(undefined);

  // Search anime via local API
  function doSearch(q: string) {
    if (!q.trim()) { setResults([]); setDropdownOpen(false); return; }
    setSearching(true);
    fetch(`/api/anime/search?q=${encodeURIComponent(q)}&page=1`)
      .then((r) => r.json())
      .then((d) => {
        setResults((d.data || []).slice(0, 8));
        setDropdownOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }

  function onSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setResults([]); setDropdownOpen(false); return; }
    searchTimer.current = window.setTimeout(() => doSearch(val), 300);
  }

  function selectAnime(a: AnimeResult) {
    setSelected(a);
    setSearch(a.title);
    setResults([]);
    setDropdownOpen(false);
  }

  // Multi-file drop
  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles: FileEntry[] = Array.from(fileList).map((f) => ({
      id: ++uid,
      file: f,
      ep: guessEp(f.name),
      quality: globalQuality,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function updateEntry(id: number, field: "ep" | "quality", val: string) {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, [field]: val } : f));
  }

  function removeFile(id: number) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  // Guess episode from filename: "Frieren - 05 [720p].mp4" → "5"
  function guessEp(filename: string): string {
    const m = filename.match(/[eE][pP]?\s*0*(\d+)/) || filename.match(/-\s*0*(\d+)/);
    return m ? String(parseInt(m[1])) : "";
  }

  // Single quick upload
  async function uploadSingle(entry: FileEntry): Promise<{ ok: boolean; error?: string }> {
    const form = new FormData();
    form.set("file", entry.file);
    form.set("malId", String(selected!.mal_id));
    form.set("ep", entry.ep);
    form.set("title", selected!.title);
    form.set("quality", entry.quality);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
    return { ok: true };
  }

  async function uploadAll() {
    if (!selected) return;
    const pending = files.filter((f) => f.status !== "done");
    if (pending.length === 0) return;

    setUploadingAll(true);
    for (const entry of pending) {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "uploading" } : f));
      const result = await uploadSingle(entry);
      setFiles((prev) => prev.map((f) => f.id === entry.id
        ? { ...f, status: result.ok ? "done" : "error", error: result.error }
        : f));
      // Tiny delay between uploads
      await new Promise((r) => setTimeout(r, 200));
    }
    setUploadingAll(false);
  }

  // Drop zone
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4 space-y-4 mb-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 mb-1">
        <Upload className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Upload Manual</h3>
      </div>

      {/* Anime Search */}
      <div className="relative">
        <label className="text-[11px] text-muted">Cari Anime</label>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => results.length > 0 && setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
              placeholder="Ketik judul anime..."
              className="w-full rounded border border-border bg-surface pl-8 pr-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/50" />
            {searching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted" />}
          </div>
        </div>

        {dropdownOpen && results.length > 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-surface shadow-xl max-h-56 overflow-y-auto">
            {results.map((a) => (
              <button
                key={a.mal_id}
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-accent/5 text-left"
                onMouseDown={() => selectAnime(a)}
              >
                <Image src={a.images.webp.large_image_url} alt="" width={32} height={45} className="rounded object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{a.title}</p>
                  <p className="text-[10px] text-muted">
                    {a.type || "TV"}{a.episodes ? ` • ${a.episodes} eps` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="flex items-center gap-2 rounded bg-accent/10 px-3 py-1.5">
          <Film className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs text-foreground truncate">{selected.title}</span>
          <span className="text-[10px] text-muted/60 ml-auto">ID: {selected.mal_id}</span>
          <button type="button" onClick={() => { setSelected(null); setSearch(""); }} className="text-muted/40 hover:text-red-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Global Quality */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted shrink-0">Kualitas default:</span>
        <select value={globalQuality} onChange={(e) => setGlobalQuality(e.target.value)}
          className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30">
          <option value="720p">720p</option>
          <option value="1080p">1080p</option>
          <option value="480p">480p</option>
          <option value="360p">360p</option>
        </select>
      </div>

      {/* Drop zone or file picker */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/40 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <Plus className="h-6 w-6 text-muted/30 mx-auto mb-2" />
        <p className="text-xs text-muted">Klik atau drag file video ke sini</p>
        <p className="text-[10px] text-muted/40 mt-0.5">MP4, MKV, WebM</p>
        <input ref={fileRef} type="file" accept="video/*,.mp4,.mkv,.webm" multiple className="hidden"
          onChange={(e) => addFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {files.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 rounded bg-surface border border-border px-2 py-1.5">
              <span className="text-xs text-foreground truncate flex-1 min-w-0">{entry.file.name}</span>
              <input
                type="text"
                value={entry.ep}
                onChange={(e) => updateEntry(entry.id, "ep", e.target.value)}
                placeholder="Ep"
                className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
              <select
                value={entry.quality}
                onChange={(e) => updateEntry(entry.id, "quality", e.target.value)}
                className="rounded border border-border bg-background px-1 py-0.5 text-[10px] text-foreground focus:outline-none"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
              {entry.status === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              ) : entry.status === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />
              ) : entry.status === "error" ? (
                <span className="text-[10px] text-red-400 shrink-0">error</span>
              ) : null}
              {entry.status !== "uploading" && (
                <button type="button" onClick={() => removeFile(entry.id)} className="text-muted/40 hover:text-red-400 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload all button */}
      {selected && files.length > 0 && (
        <button type="button" onClick={uploadAll} disabled={uploadingAll || files.every((f) => f.status === "done")}
          className="flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40 transition-colors">
          {uploadingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Semua"}
        </button>
      )}
    </div>
  );
}
