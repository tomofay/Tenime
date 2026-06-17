export default function BrowseLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
      <div className="hidden lg:block h-8 w-48 bg-surface rounded animate-pulse mb-6" />
      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="space-y-4">
            <div className="h-4 w-20 bg-surface rounded animate-pulse" />
            <div className="h-8 w-full bg-surface rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-16 bg-surface rounded animate-pulse" />
              <div className="flex flex-wrap gap-1.5">
                {[1,2,3,4,5,6].map(i=><div key={i} className="h-7 w-14 bg-surface rounded animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-6 w-16 bg-surface rounded animate-pulse" />
              <div className="flex flex-wrap gap-1.5">
                {[1,2,3].map(i=><div key={i} className="h-7 w-20 bg-surface rounded animate-pulse" />)}
              </div>
            </div>
          </div>
        </aside>
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] bg-surface rounded-xl animate-pulse" />
                <div className="mt-2 h-4 bg-surface rounded animate-pulse w-3/4" />
                <div className="mt-1 h-3 bg-surface rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
