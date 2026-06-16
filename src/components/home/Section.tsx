"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SectionProps {
  title: string;
  children: ReactNode;
  variant?: "horizontal" | "grid";
  seeAllHref?: string;
}

export function Section({ title, children, variant = "horizontal", seeAllHref }: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (variant !== "horizontal") return;
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [variant, children]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              Lihat Semua →
            </Link>
          )}
        </div>

        {variant === "horizontal" ? (
          <div className="relative group/scroll">
            {/* Scroll container */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-4 px-4 pb-1"
            >
              {children}
            </div>

            {/* Left nav */}
            {canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 text-foreground shadow-lg opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Right nav */}
            {canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm p-2 text-foreground shadow-lg opacity-0 group-hover/scroll:opacity-100 transition-opacity"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
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

