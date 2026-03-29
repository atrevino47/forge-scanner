'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { clipReveal, scaleIn } from '@/lib/gsap-presets';

const stats = [
  { value: '500+', label: 'Scans Completed' },
  { value: '< 60s', label: 'Average Scan Time' },
  { value: '5', label: 'Funnel Stages Analyzed' },
  { value: 'Free', label: 'Always' },
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
      style={{ background: '#FAFAF7' }}
    >
      <div className="mx-auto max-w-[1120px]">
        <h2
          data-trust="headline"
          className="mb-16 text-center font-display font-bold"
          style={{
            fontSize: 'clamp(1.75rem, 3vw + 0.5rem, 2.75rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            color: '#1A1917',
          }}
        >
          Built for businesses that want to grow
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              data-trust="stat"
              className="rounded-xl border p-6 text-center sm:p-8"
              style={{
                borderColor: '#ECEAE4',
                background: '#FAFAF7',
              }}
            >
              {/* Number — font-display text-4xl weight-800 */}
              <p
                className="font-display text-4xl font-extrabold"
                style={{
                  letterSpacing: '-0.02em',
                  color: '#1A1917',
                }}
              >
                {stat.value}
              </p>
              {/* Label — font-mono text-xs uppercase */}
              <p
                className="mt-2 font-mono text-xs uppercase tracking-widest"
                style={{ color: '#6B6860' }}
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
