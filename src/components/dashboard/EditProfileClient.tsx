"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditProfileForm } from "@/components/dashboard/EditProfileForm";

export function EditProfileClient() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Link>
      <div className="mb-6 motion-safe:animate-state-in">
        <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
        <p className="text-sm text-muted mt-1">Perbarui foto dan bio kamu.</p>
      </div>
      <EditProfileForm />
    </div>
  );
}
