'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { scaleIn } from '@/lib/gsap-presets';

const steps = [
  {
    number: '01',
    title: 'Enter Your URL',
    description:
      'Paste your website URL. Our AI starts scanning your entire digital presence immediately.',
  },
  {
    number: '02',
    title: 'AI Analyzes Everything',
    description:
      'We capture real screenshots of your site, socials, ads, and GBP. AI annotates every issue with specific callouts.',
  },
  {
    number: '03',
    title: 'Get Your Blueprint',
    description:
      'See your optimized funnel map and a professional mockup of your weakest piece. Then book a free strategy call.',
  },
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE (scroll-triggered at top 85% viewport):
   * Beat 1 (0.00s): Step cards — scaleIn with 120ms stagger
   */
  useGSAP(
    () => {
      const cards = scaleIn({ stagger: 0.12 });
      gsap.fromTo('[data-how="card"]', cards.from, {
        ...cards.vars,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative px-4 py-14 sm:px-6 sm:py-24 lg:py-32"
      style={{ background: '#F5F4F0' }}
    >
      <div className="mx-auto max-w-[1120px]">
        {/* Section label — font-mono xs uppercase tracking-widest */}
        <p
          className="mb-12 text-center font-mono text-xs uppercase tracking-widest"
          style={{ color: '#6B6860' }}
        >
          How It Works
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              data-how="card"
              className="relative overflow-hidden rounded-xl border p-8"
              style={{
                borderColor: '#ECEAE4',
                background: '#FAFAF7',
                minHeight: '200px',
              }}
            >
              {/* Step number — font-mono text-6xl Forge Orange opacity 0.15 */}
              <span
                className="pointer-events-none absolute right-4 top-2 select-none font-mono text-7xl font-bold leading-none"
                style={{ color: '#E8530E', opacity: 0.15 }}
              >
                {step.number}
              </span>

              <h3
                className="mb-3 font-display text-xl font-bold"
                style={{ color: '#1A1917', letterSpacing: '-0.01em' }}
              >
                {step.title}
              </h3>
              <p
                className="font-body text-sm"
                style={{ lineHeight: 1.65, color: '#6B6860' }}
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
