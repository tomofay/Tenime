"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, Loader2, Check } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function EditProfileForm() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.bio) setBio(d.bio);
        setLoaded(true);
      });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = file.type === "image/gif" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) { setError("Max 5MB (GIF max 10MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData();
    form.set("bio", bio);
    if (fileRef.current?.files?.[0]) form.set("file", fileRef.current.files[0]);

    const res = await fetch("/api/user/profile", { method: "POST", body: form });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Gagal"); setSaving(false); return; }

    await update({ hasAvatar: true });
    setSaving(false);
    setSaved(true);
    setError("");
    window.setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  if (!loaded) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-border bg-surface/40 p-5 sm:p-6 space-y-6 motion-safe:animate-state-in">
      {/* Profile picture */}
      <section className="flex flex-col items-center gap-3">
        <label className="relative cursor-pointer group">
          {preview ? (
            <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-accent motion-safe:animate-card-in" />
          ) : (
            <UserAvatar size="lg" userId={session?.user?.id as string} />
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Pilih foto profil" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-full" onChange={handleFileChange} />
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs font-medium text-accent hover:text-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
        >
          {preview ? "Ganti foto" : "Ubah foto"}
        </button>
        <p className="text-xs text-muted text-center">PNG, JPEG, WebP, atau GIF (maks 5MB, GIF 10MB)</p>
      </section>

      <div className="border-t border-border" />

      {/* Account */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-muted">Username</label>
            <span className="text-[10px] uppercase tracking-wide text-muted/60">Terkunci</span>
          </div>
          <p className="text-sm font-medium text-foreground mt-1">{session?.user?.name || "—"}</p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-muted">Email</label>
            <span className="text-[10px] uppercase tracking-wide text-muted/60">Terkunci</span>
          </div>
          <p className="text-sm font-medium text-foreground mt-1">{session?.user?.email || "—"}</p>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* About */}
      <section>
        <label htmlFor="bio" className="text-xs font-medium text-muted">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none"
          placeholder="Tulis tentang dirimu..."
        />
      </section>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-400 motion-safe:animate-state-in">{error}</p>
      )}

      {saved && !error && (
        <p className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent motion-safe:animate-state-in">
          <Check className="h-3.5 w-3.5" />
          Perubahan tersimpan
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50 transition-colors pressable-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
      </button>
    </form>
  );
}
