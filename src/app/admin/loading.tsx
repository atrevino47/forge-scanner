// Skeleton shown by Next.js while any /admin/* page loads.
// Matches the admin layout: dark mode, metric cards + table skeleton.

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded bg-[#282826]" />
        <div className="h-4 w-52 animate-pulse rounded bg-[#1E1E1C]" />
      </div>

      {/* Metric cards skeleton — 4 across */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[rgba(255,107,43,0.08)] bg-[#1E1E1C] p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-[#282826]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#282826]" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded bg-[#282826]" />
            <div className="mt-2 h-3 w-28 animate-pulse rounded bg-[#1E1E1C]" />
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
              className="h-3 animate-pulse rounded bg-[#353533]"
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
              <div className="h-4 w-40 animate-pulse rounded bg-[#282826]" />
              <div className="h-3 w-28 animate-pulse rounded bg-[#1E1E1C]" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded-sm bg-[#282826]" />
            <div className="hidden h-4 w-12 animate-pulse rounded bg-[#1E1E1C] md:block" />
            <div className="h-3 w-10 animate-pulse rounded bg-[#1E1E1C]" />
          </div>
        ))}
      </div>
    </div>
  );
}
