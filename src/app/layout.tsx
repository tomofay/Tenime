import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PwaRegistration } from "@/components/layout/PwaRegistration";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tenime — Streaming Anime Sub Indo",
    template: "%s | Tenime",
  },
  description:
    "Nonton anime subtitle Indonesia gratis, tanpa iklan pop-up. UI modern, ringan, dan cepat.",
  openGraph: {
    title: "Tenime — Streaming Anime Sub Indo",
    description: "Nonton anime subtitle Indonesia gratis, tanpa iklan pop-up.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tenime",
  },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-accent px-4 py-2 text-sm text-white"
        >
          Skip to content
        </a>
        <Providers>
          <Navbar />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <CommandPalette />
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
