import Link from "next/link";

interface GenreChipProps {
  malId: number;
  name: string;
  size?: "sm" | "md";
  active?: boolean;
}

export function GenreChip({
  malId,
  name,
  size = "sm",
  active = false,
}: GenreChipProps) {
  return (
    <Link
      href={`/browse?genres=${malId}`}
      className={`inline-block rounded-full border transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border hover:border-accent/50 text-muted hover:text-foreground"
      } ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      {name}
    </Link>
  );
}
