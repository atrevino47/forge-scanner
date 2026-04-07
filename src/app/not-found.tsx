import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAFAF7] px-6">
      {/* Grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Faint orange radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/4 translate-x-1/4"
        style={{
          background:
            'radial-gradient(circle at center, rgba(232,83,14,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Large "404" watermark */}
      <p
        aria-hidden
        className="pointer-events-none absolute select-none font-display font-black text-[#1A1917]"
        style={{
          fontSize: 'clamp(180px, 30vw, 320px)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          opacity: 0.03,
        }}
      >
        404
      </p>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ECEAE4] bg-[#F5F4F0] px-4 py-1.5">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-forge-accent"
          />
          <span className="font-mono text-xs text-[#6B6860]">Page Not Found</span>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-black text-[#1A1917]"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            maxWidth: '520px',
          }}
        >
          This page doesn&apos;t exist
        </h1>

        {/* Body */}
        <p
          className="font-body text-[#6B6860]"
          style={{ fontSize: '1.125rem', lineHeight: 1.65, maxWidth: '400px' }}
        >
          The URL you followed may be broken, or the page may have been removed.
        </p>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-forge-accent px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-forge-accent-bright"
          >
            Scan your funnel
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[#ECEAE4] bg-[#F5F4F0] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-[#6B6860] transition-colors hover:bg-[#ECEAE4] hover:text-[#1A1917]"
          >
            Go home
          </Link>
        </div>
      </div>

      {/* Footer mark */}
      <p className="absolute bottom-8 font-mono text-[10px] text-[#B8B5AD]">
        forgewith.ai
      </p>
    </div>
  );
}
