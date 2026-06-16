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
      <h1 className="text-xl font-bold text-foreground mb-6">Edit Profile</h1>
      <EditProfileForm />
    </div>
  );
}
