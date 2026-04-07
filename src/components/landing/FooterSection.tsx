'use client';

import { useCalcom } from '@/components/providers/CalcomContext';

export function FooterSection() {
  const { openCalcom } = useCalcom();

  return (
    <>
      {/* Dark CTA close section */}
      <section
        className="relative overflow-hidden px-4 py-14 text-center sm:px-6 sm:py-24 lg:py-32"
        style={{
          background: '#141413',
          color: '#F0EFE9',
        }}
      >
        {/* Orange radial glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2"
          style={{
            background: 'radial-gradient(ellipse, rgba(232,83,14,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-[600px]">
          <h2
            className="mb-6 font-display text-3xl font-bold sm:text-4xl"
            style={{ letterSpacing: '-0.02em', lineHeight: 1.08 }}
          >
            Your funnel has blind spots.
            <br />
            <span style={{ color: 'var(--forge-accent)' }}>Let us find every one.</span>
          </h2>

          <p
            className="mb-4 font-mono text-xs uppercase tracking-widest"
            style={{ color: '#6B6860' }}
          >
            AI isn&apos;t magic. It&apos;s infrastructure.
          </p>

          <p
            className="mb-10 font-body text-base"
            style={{ color: '#9A9890', lineHeight: 1.65 }}
          >
            Free scan. Free strategy call. No obligation. Just answers.
          </p>

          <button
            onClick={() => openCalcom({ source: 'footer_cta' })}
            className="inline-flex items-center gap-2 rounded-[9px] px-8 py-3.5 font-body text-base font-semibold transition-colors duration-200"
            style={{
              background: 'var(--forge-accent)',
              color: '#FAFAF7',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--forge-accent-bright)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--forge-accent)';
            }}
          >
            Book a Free Strategy Call
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-10"
        style={{
          background: '#1A1917',
          borderTop: '1px solid rgba(236, 234, 228, 0.08)',
        }}
      >
        <div className="mx-auto max-w-[960px]">
          {/* Top row: Logo + nav links */}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* Logo — FORGE in Outfit white */}
            <span
              className="font-display text-base font-black tracking-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              <span style={{ color: '#FAFAF7' }}>FORGE</span>
              <span style={{ color: 'var(--forge-accent)' }}>WITH.AI</span>
            </span>

            {/* Nav links */}
            <nav className="flex items-center gap-6">
              <a
                href="/privacy"
                className="font-body text-sm transition-colors duration-150"
                style={{ color: '#B8B5AD' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#FAFAF7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#B8B5AD'; }}
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="font-body text-sm transition-colors duration-150"
                style={{ color: '#B8B5AD' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#FAFAF7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#B8B5AD'; }}
              >
                Terms
              </a>
            </nav>
          </div>

          {/* Bottom row: Copyright */}
          <p
            className="font-body text-xs"
            style={{ color: '#6B6860' }}
          >
            &copy; 2026 forgewith.ai
          </p>
        </div>
      </footer>
    </>
  );
}
