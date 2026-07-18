import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Buat akun Kicaunime baru.",
};

export default function RegisterPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Register
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-8">
          Create your Kicaunime account
        </p>
        <AuthForm mode="register" />
      </div>
    </main>
  );
}
