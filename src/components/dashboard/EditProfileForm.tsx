"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function EditProfileForm() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
    if (file.size > 5 * 1024 * 1024) { setError("Max 5MB"); return; }
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
    router.refresh();
  }

  if (!loaded) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <label className="relative cursor-pointer group">
          {preview ? (
            <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-accent" />
          ) : (
            <UserAvatar size="lg" userId={session?.user?.id as string} />
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
        </label>
        <p className="text-xs text-muted">Klik untuk ganti foto (PNG/JPEG/WebP/GIF, max 5MB)</p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted">Username</label>
        <p className="text-sm font-medium text-foreground mt-1">{session?.user?.name || "—"}</p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted">Email</label>
        <p className="text-sm font-medium text-foreground mt-1">{session?.user?.email || "—"}</p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
          placeholder="Tulis tentang dirimu..."
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
      </button>
    </form>
  );
}
