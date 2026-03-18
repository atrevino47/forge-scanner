'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { clipReveal, scaleIn } from '@/lib/gsap-presets';

const stats = [
  { value: '[COPY: stat 1 value]', label: '[COPY: stat 1 label]' },
  { value: '[COPY: stat 2 value]', label: '[COPY: stat 2 label]' },
  { value: '[COPY: stat 3 value]', label: '[COPY: stat 3 label]' },
  { value: '[COPY: stat 4 value]', label: '[COPY: stat 4 label]' },
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
    <section ref={containerRef} className="dot-grid relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1120px]">
        <h2
          data-trust="headline"
          className="font-display mb-16 text-center tracking-display leading-display"
          style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 3rem)' }}
        >
          [COPY: trust section headline]
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              data-trust="stat"
              className="glass-card rounded-xl p-6 text-center sm:p-8"
            >
              <p className="font-display text-3xl tracking-display text-forge-text sm:text-4xl">
                {stat.value}
              </p>
              <p className="font-body mt-2 text-sm text-forge-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
