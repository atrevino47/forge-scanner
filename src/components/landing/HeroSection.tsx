'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { clipReveal, fadeSlideUp } from '@/lib/gsap-presets';

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Badge — fadeSlideUp
   * Beat 2 (0.15s): Headline — clipReveal
   * Beat 3 (0.40s): Subheadline — fadeSlideUp
   * Beat 4 (0.60s): URL Input — fadeSlideUp
   * Beat 5 (0.80s): Trust indicators — fadeSlideUp
   */
  useGSAP(
    () => {
      const tl = gsap.timeline({ delay: 0.3 });

      const badge = fadeSlideUp();
      tl.fromTo('[data-hero="badge"]', badge.from, badge.vars, 0);

      const headline = clipReveal();
      tl.fromTo('[data-hero="headline"]', headline.from, headline.vars, 0.15);

      const sub = fadeSlideUp();
      tl.fromTo('[data-hero="subheadline"]', sub.from, sub.vars, 0.4);

      const input = fadeSlideUp();
      tl.fromTo('[data-hero="input"]', input.from, input.vars, 0.6);

      const trust = fadeSlideUp();
      tl.fromTo('[data-hero="trust"]', trust.from, trust.vars, 0.8);
    },
    { scope: containerRef },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) throw new Error('Failed to start scan');
      const data = (await res.json()) as { scanId: string };
      router.push(`/scan/${data.scanId}`);
    } catch {
      // TODO: Error toast (Phase 2)
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center px-6 pt-20"
    >
      {/* Subtle radial gradient accent glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(212, 165, 55, 0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[960px] text-center">
        {/* Badge */}
        <div
          data-hero="badge"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-forge-border bg-forge-surface px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-forge-accent" />
          <span className="font-body text-sm font-medium text-forge-text-muted">
            [COPY: eyebrow badge text]
          </span>
        </div>

        {/* Headline */}
        <h1
          data-hero="headline"
          className="font-display mx-auto mb-6 tracking-display leading-display"
          style={{ fontSize: 'clamp(2.5rem, 5vw + 1rem, 4.5rem)' }}
        >
          [COPY: benefit-driven headline about scanning their funnel]
        </h1>

        {/* Subheadline */}
        <p
          data-hero="subheadline"
          className="font-body mx-auto mb-10 max-w-lg text-lg leading-body text-forge-text-muted"
        >
          [COPY: what happens when they enter their URL]
        </p>

        {/* URL Input */}
        <form data-hero="input" onSubmit={handleSubmit} className="mx-auto mb-8 max-w-xl">
          <div className="group relative flex items-center rounded-xl border border-forge-border bg-forge-surface/80 backdrop-blur-sm transition-colors duration-200 hover:border-forge-accent/30 focus-within:border-forge-accent/40 focus-within:shadow-[0_0_30px_rgba(212,165,55,0.08)]">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourwebsite.com"
              required
              className="h-14 flex-1 bg-transparent px-5 font-body text-base text-forge-text placeholder:text-forge-text-muted/50 focus:outline-none sm:h-16 sm:text-lg"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="mr-2 flex h-10 shrink-0 items-center gap-2 rounded-lg bg-forge-accent px-5 font-body text-sm font-semibold text-forge-base transition-colors duration-200 hover:bg-forge-accent-hover disabled:opacity-50 sm:h-12 sm:px-6 sm:text-base"
            >
              {isSubmitting ? 'Scanning...' : '[COPY: scan CTA]'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </form>

        {/* Trust indicators */}
        <div
          data-hero="trust"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-forge-text-muted"
        >
          <span>[COPY: trust indicator 1]</span>
          <span className="hidden h-1 w-1 rounded-full bg-forge-text-muted/30 sm:block" />
          <span>[COPY: trust indicator 2]</span>
          <span className="hidden h-1 w-1 rounded-full bg-forge-text-muted/30 sm:block" />
          <span>[COPY: trust indicator 3]</span>
        </div>
      </div>
    </section>
  );
}
