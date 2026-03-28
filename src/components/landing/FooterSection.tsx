'use client';

import { useCalcom } from '@/components/providers/CalcomContext';

export function FooterSection() {
  const { openCalcom } = useCalcom();

  return (
    <>
      {/* Dark CTA close section */}
      <section
        className="relative overflow-hidden px-6 py-24 text-center sm:py-32"
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
            <span style={{ color: 'var(--forge-accent)' }}>Let Adrian fix them.</span>
          </h2>

          <p
            className="mb-10 font-body text-base"
            style={{ color: '#9A9890', lineHeight: 1.65 }}
          >
            Free scan. Free strategy call. No obligation. Just answers.
          </p>

          <button
            onClick={() => openCalcom({ source: 'results_cta' })}
            className="inline-flex items-center gap-2 rounded-[9px] px-8 py-3.5 font-body text-base font-semibold transition-all duration-200"
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
        className="px-6 py-8"
        style={{
          background: '#141413',
          borderTop: '1px solid rgba(255, 107, 43, 0.08)',
        }}
      >
        <div className="mx-auto flex max-w-[960px] items-center justify-between">
          <span
            className="font-display text-sm font-bold"
            style={{ color: '#9A9890' }}
          >
            FORGEWITH<span style={{ color: 'var(--forge-accent)' }}>.AI</span>
          </span>
          <p className="font-body text-xs" style={{ color: '#6B6860' }}>
            Built by Adrian Trevino &middot; forgewith.ai
          </p>
        </div>
      </footer>
    </>
  );
}
