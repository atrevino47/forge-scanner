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
  const [formError, setFormError] = useState<string | null>(null);
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

    if (!trimmed) {
      setFormError('Please enter your website URL.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        let message = 'Something went wrong. Please try again.';
        try {
          const errData = (await res.json()) as { error?: { message?: string } };
          if (errData.error?.message) message = errData.error.message;
        } catch {}
        setFormError(message);
        setIsSubmitting(false);
        return;
      }

      const data = (await res.json()) as { scanId: string };
      router.push(`/scan/${data.scanId}`);
    } catch {
      setFormError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center px-4 pt-20 sm:px-6"
      id="hero"
    >
      {/* Orange radial gradient glow */}
      <div
        className="pointer-events-none absolute -right-[200px] -top-[200px] h-[700px] w-[700px]"
        style={{
          background: 'radial-gradient(circle, rgba(232,83,14,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Decorative "F" watermark */}
      <div
        className="pointer-events-none absolute -right-[30px] -top-[50px] select-none font-display text-[380px] font-black leading-none"
        style={{ color: 'rgba(26,25,23,0.03)' }}
      >
        F
      </div>

      <div className="relative z-10 mx-auto max-w-[960px] text-center">
        {/* Badge */}
        <div
          data-hero="badge"
          className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
          style={{
            borderColor: 'var(--forge-border)',
            background: 'var(--forge-surface)',
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--forge-accent)' }}
          />
          <span className="font-body text-sm font-medium" style={{ color: 'var(--forge-text-secondary)' }}>
            AI-Powered Sales Infrastructure
          </span>
        </div>

        {/* Headline */}
        <h1
          data-hero="headline"
          className="mx-auto mb-6 max-w-[600px] font-display font-black"
          style={{
            fontSize: 'clamp(2.5rem, 5vw + 1rem, 4rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            color: 'var(--forge-text)',
          }}
        >
          Your funnel is leaking revenue.
          <br />
          <span style={{ color: 'var(--forge-text-secondary)' }}>Let&apos;s find where.</span>
        </h1>

        {/* Subheadline */}
        <p
          data-hero="subheadline"
          className="mx-auto mb-10 max-w-lg font-body text-lg"
          style={{
            lineHeight: 1.65,
            color: 'var(--forge-text-secondary)',
          }}
        >
          We scan your website, socials, and ads — then AI pinpoints exactly what&apos;s costing you customers. Real screenshots. Specific fixes. No fluff.
        </p>

        {/* URL Input */}
        <form data-hero="input" onSubmit={handleSubmit} className="mx-auto mb-8 max-w-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className="group relative flex flex-1 items-center overflow-hidden rounded-xl border transition-all duration-300"
              style={{
                borderColor: 'var(--forge-border)',
                background: 'var(--forge-surface)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(232, 83, 14, 0.3)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(232, 83, 14, 0.06)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--forge-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (formError) setFormError(null); }}
                placeholder="yourwebsite.com"
                required
                className="h-14 flex-1 bg-transparent px-5 font-body text-base placeholder:text-forge-text-muted/50 focus:outline-none sm:h-16 sm:text-lg"
                style={{ color: 'var(--forge-text)' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-body text-sm font-semibold transition-all duration-200 disabled:opacity-50 sm:h-16 sm:w-auto sm:shrink-0 sm:px-6 sm:text-base"
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
              {isSubmitting ? 'Scanning...' : 'Scan My Funnel'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
          {formError && (
            <p className="font-body text-sm text-forge-critical mt-2">{formError}</p>
          )}
        </form>

        {/* Trust indicators */}
        <div
          data-hero="trust"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-widest"
          style={{ color: 'var(--forge-text-muted)' }}
        >
          <span>Free, no card required</span>
          <span className="hidden h-1 w-1 rounded-full sm:block" style={{ background: 'var(--forge-text-muted)', opacity: 0.3 }} />
          <span>5 funnel stages analyzed</span>
          <span className="hidden h-1 w-1 rounded-full sm:block" style={{ background: 'var(--forge-text-muted)', opacity: 0.3 }} />
          <span>Built for $500K–$5M service businesses</span>
        </div>
      </div>
    </section>
  );
}
