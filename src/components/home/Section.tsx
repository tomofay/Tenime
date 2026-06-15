"use client";

import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
  variant?: "horizontal" | "grid";
}

export function Section({ title, children, variant = "horizontal" }: SectionProps) {
  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-lg font-semibold text-foreground mb-5">{title}</h2>
        {variant === "horizontal" ? (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
            {children}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
