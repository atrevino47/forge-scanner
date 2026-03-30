// Skeleton shown by Next.js while the /scan/[id] page shell loads.
// Matches the scanning-state layout: centered progress indicator.

export default function ScanLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF7] px-6">
      {/* Top bar skeleton */}
      <div className="fixed inset-x-0 top-0 z-50 h-14 border-b border-[#ECEAE4] bg-[rgba(250,250,247,0.92)]" />

      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        {/* Animated logo mark */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-forge-accent/10"
            style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
          />
          <span className="font-display text-xl font-black tracking-tight text-[#1A1917]">F</span>
        </div>

        {/* Status line shimmer */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-4 w-56 animate-pulse rounded-full bg-[#ECEAE4]" />
          <div className="h-3 w-40 animate-pulse rounded-full bg-[#F5F4F0]" />
          <div className="h-3 w-32 animate-pulse rounded-full bg-[#F5F4F0]" />
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-48 overflow-hidden rounded-full bg-[#ECEAE4]">
          <div
            className="h-full w-1/3 rounded-full bg-forge-accent"
            style={{
              animation: 'shimmer 1.6s ease-in-out infinite',
            }}
          />
        </div>

        <p className="font-mono text-[10px] uppercase tracking-widest text-[#B8B5AD]">
          Starting scan…
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
