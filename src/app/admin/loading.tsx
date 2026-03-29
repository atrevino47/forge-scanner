// Skeleton shown by Next.js while any /admin/* page loads.
// Matches the admin layout: dark mode, metric cards + table skeleton.

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-36 rounded skeleton-dark" />
        <div className="h-4 w-52 rounded skeleton-dark-deep" />
      </div>

      {/* Metric cards skeleton — 4 across */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[rgba(255,107,43,0.08)] bg-[#1E1E1C] p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 rounded skeleton-dark" />
              <div className="h-3 w-20 rounded skeleton-dark" />
            </div>
            <div className="h-8 w-24 rounded skeleton-dark" />
            <div className="mt-2 h-3 w-28 rounded skeleton-dark-deep" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-[rgba(255,107,43,0.08)] bg-[#1E1E1C]">
        {/* Table header */}
        <div className="flex gap-4 border-b border-[rgba(255,107,43,0.06)] bg-[#282826] px-5 py-3">
          {[120, 80, 60, 60].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded skeleton-dark"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[rgba(255,107,43,0.04)] px-5 py-3.5"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 rounded skeleton-dark" />
              <div className="h-3 w-28 rounded skeleton-dark-deep" />
            </div>
            <div className="h-5 w-16 rounded-sm skeleton-dark" />
            <div className="hidden h-4 w-12 rounded skeleton-dark-deep md:block" />
            <div className="h-3 w-10 rounded skeleton-dark-deep" />
          </div>
        ))}
      </div>
    </div>
  );
}
