'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Globe, Zap, FileText } from 'lucide-react';
import { clipReveal, fadeSlideUp } from '@/lib/gsap-presets';

const steps = [
  {
    number: '01',
    icon: Globe,
    title: '[COPY: Step 1 title]',
    description: '[COPY: Step 1 description — entering their URL]',
  },
  {
    number: '02',
    icon: Zap,
    title: '[COPY: Step 2 title]',
    description: '[COPY: Step 2 description — AI scanning their funnel]',
  },
  {
    number: '03',
    icon: FileText,
    title: '[COPY: Step 3 title]',
    description: '[COPY: Step 3 description — receiving their blueprint]',
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
          className="font-display mb-16 text-center tracking-display leading-display"
          style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 3rem)' }}
        >
          [COPY: How it works section title]
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} data-how="card" className="glass-card rounded-xl p-8">
              <span className="font-mono text-sm font-medium text-forge-accent">
                {step.number}
              </span>

              <div className="mt-4 mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-forge-border bg-forge-surface">
                <step.icon className="h-5 w-5 text-forge-text-muted" />
              </div>

              <h3 className="font-body mb-2 text-lg font-semibold text-forge-text">
                {step.title}
              </h3>
              <p className="font-body text-sm leading-body text-forge-text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
