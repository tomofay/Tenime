"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Search,
  Menu,
  X,
  LogIn,
  Play,
  BookOpen,
  Home,
  Calendar,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Browse", icon: BookOpen },
  { href: "/schedule", label: "Jadwal", icon: Calendar },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Play className="h-5 w-5 text-accent fill-accent" />
          <span className="text-lg font-bold tracking-tight text-foreground">Tenime</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted bg-surface border border-border hover:border-accent/50 hover:text-foreground transition-colors min-w-[200px]"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="text-xs">Cari anime...</span>
            <kbd className="ml-auto hidden lg:inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">⌘K</kbd>
          </Link>

          {session ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <UserAvatar size="sm" />
              <span className="hidden sm:inline text-sm font-medium text-foreground">
                {session.user?.name || "User"}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-md p-1.5 text-muted hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 space-y-1">
          <Link
            href="/browse"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <Search className="h-4 w-4" />Cari anime...
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <link.icon className="h-4 w-4" />{link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
