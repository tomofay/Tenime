import Link from "next/link";
import type { Anime } from "@/types/anime";

interface RelationsTabProps {
  relations: Anime["relations"];
}

export function RelationsTab({ relations }: RelationsTabProps) {
  if (!relations || relations.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">Tidak ada relasi tersedia.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {relations.map((rel) => (
        <div key={rel.relation}>
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            {rel.relation}
          </h3>
          <div className="flex flex-wrap gap-2">
            {rel.entry.map((entry) => (
              <Link
                key={entry.mal_id}
                href={`/anime/${entry.mal_id}`}
                className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground hover:border-accent/50 hover:text-accent transition-colors"
              >
                {entry.name}
                <span className="ml-1.5 text-xs text-muted">
                  {entry.type}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
