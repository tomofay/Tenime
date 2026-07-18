import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Login ke akun Kicaunime kamu.",
};

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-foreground">
          Login
        </h1>
        <p className="text-sm text-muted text-center mt-1 mb-8">
          Welcome back to Kicaunime
        </p>
        <AuthForm mode="login" />
      </div>
    </main>
  );
}
