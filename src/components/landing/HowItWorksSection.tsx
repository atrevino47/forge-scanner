'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Globe, Scan, FileText } from 'lucide-react';
import { clipReveal, fadeSlideUp } from '@/lib/gsap-presets';

const steps = [
  {
    number: '01',
    icon: Globe,
    title: 'Enter your URL',
    description: 'Drop your website URL and we start scanning immediately. We find your social profiles, GBP, and ads automatically.',
  },
  {
    number: '02',
    icon: Scan,
    title: 'AI scans your funnel',
    description: 'We capture real screenshots of every touchpoint. AI annotates what\'s broken, what\'s missing, and what\'s costing you leads.',
  },
  {
    number: '03',
    icon: FileText,
    title: 'Get your blueprint',
    description: 'See your current funnel vs. the optimized version. Get a visual mockup of the fix — and book a free strategy call.',
  },
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE (scroll-triggered at top 80% viewport):
   * Beat 1 (0.00s): Section headline — clipReveal
   * Beat 2 (0.20s): Step cards — fadeSlideUp with 150ms stagger
   */
  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      const headline = clipReveal();
      tl.fromTo('[data-how="headline"]', headline.from, headline.vars, 0);

      const cards = fadeSlideUp({ stagger: 0.15 });
      tl.fromTo('[data-how="card"]', cards.from, cards.vars, 0.2);
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1120px]">
        <h2
          data-how="headline"
          className="mb-16 text-center font-display font-bold"
          style={{
            fontSize: 'clamp(2rem, 3vw + 0.5rem, 3rem)',
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
          }}
        >
          How it works
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              data-how="card"
              className="rounded-xl border p-8 transition-all duration-300"
              style={{
                borderColor: 'var(--forge-border)',
                background: 'var(--forge-surface)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFF7F2';
                e.currentTarget.style.borderColor = '#FFD4B3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--forge-surface)';
                e.currentTarget.style.borderColor = 'var(--forge-border)';
              }}
            >
              <span
                className="font-mono text-sm font-medium"
                style={{ color: 'var(--forge-accent)' }}
              >
                {step.number}
              </span>

              <div
                className="mt-4 mb-4 flex h-12 w-12 items-center justify-center rounded-lg border"
                style={{
                  borderColor: 'var(--forge-border)',
                  background: 'var(--forge-base)',
                }}
              >
                <step.icon className="h-5 w-5" style={{ color: 'var(--forge-text-secondary)' }} />
              </div>

              <h3
                className="mb-2 font-display text-lg font-bold"
                style={{ color: 'var(--forge-text)' }}
              >
                {step.title}
              </h3>
              <p
                className="font-body text-sm"
                style={{ lineHeight: 1.65, color: 'var(--forge-text-secondary)' }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
