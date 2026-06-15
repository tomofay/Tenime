export function SkeletonCard({ size = "md" }: { size?: "sm" | "md" }) {
  const width = size === "sm" ? 160 : 200;

  return (
    <div className="shrink-0" style={{ width }}>
      <div
        className="rounded-lg bg-surface animate-pulse"
        style={{ aspectRatio: "2/3" }}
      />
      <div className="mt-2 h-4 w-3/4 rounded bg-surface animate-pulse" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-surface animate-pulse" />
    </div>
  );
}
