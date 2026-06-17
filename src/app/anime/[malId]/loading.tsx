export default function AnimeLoading() {
  return (
    <div className="flex-1">
      <div className="h-[300px] bg-surface/30 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-5 w-32 bg-surface rounded animate-pulse mb-6" />
        <div className="space-y-3">
          <div className="h-4 bg-surface rounded animate-pulse w-3/4" />
          <div className="h-4 bg-surface rounded animate-pulse w-1/2" />
          <div className="h-4 bg-surface rounded animate-pulse w-5/6" />
        </div>
        <div className="flex gap-2 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-surface rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
