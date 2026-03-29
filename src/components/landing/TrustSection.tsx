'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { clipReveal, scaleIn } from '@/lib/gsap-presets';

const stats = [
  { value: '60s', label: 'Average scan time' },
  { value: '5', label: 'Funnel stages analyzed' },
  { value: '12+', label: 'AI annotations per scan' },
  { value: 'Free', label: 'No card required' },
];

export function TrustSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE (scroll-triggered at top 80% viewport):
   * Beat 1 (0.00s): Section headline — clipReveal
   * Beat 2 (0.20s): Stat cards — scaleIn with 100ms stagger
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
      tl.fromTo('[data-trust="headline"]', headline.from, headline.vars, 0);

      const cards = scaleIn({ stagger: 0.1 });
      tl.fromTo('[data-trust="stat"]', cards.from, cards.vars, 0.2);
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative px-6 py-24 sm:py-32"
      style={{ background: 'var(--forge-surface)' }}
    >
      <div className="mx-auto max-w-[1120px]">
        <h2
          data-trust="headline"
          className="mb-16 text-center font-display font-bold"
          style={{
            fontSize: 'clamp(2rem, 3vw + 0.5rem, 3rem)',
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
          }}
        >
          Built for speed and precision
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              data-trust="stat"
              className="rounded-xl border p-6 text-center sm:p-8"
              style={{
                borderColor: 'var(--forge-border)',
                background: '#FFFFFF',
              }}
            >
              <p
                className="font-display text-3xl font-bold sm:text-4xl"
                style={{
                  letterSpacing: '-0.02em',
                  color: 'var(--forge-text)',
                }}
              >
                {stat.value}
              </p>
              <p
                className="mt-2 font-body text-sm"
                style={{ color: 'var(--forge-text-secondary)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
