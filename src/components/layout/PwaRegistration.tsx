"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // Only register in production — Turbopack dev doesn't serve service workers
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Service worker registration can fail in some environments
    });
  }, []);

  return null;
}
