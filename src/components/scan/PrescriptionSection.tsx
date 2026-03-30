'use client';

import { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { FunnelStage } from '../../../contracts/types';
import type { StageState } from './types';
import { generatePrescriptions } from '@/lib/prescriptions';
import { PrescriptionCard } from './PrescriptionCard';
import { clipReveal, fadeSlideUp, scaleIn } from '@/lib/gsap-presets';

interface PrescriptionSectionProps {
  stages: Partial<Record<FunnelStage, StageState>>;
  onBookCall: () => void;
}

/* ANIMATION SEQUENCE (scroll-triggered at 85% viewport):
 * Beat 1 (0.00s): Badge + headline — clipReveal
 * Beat 2 (0.30s): Subtitle — fadeSlideUp
 * Beat 3 (0.50s): Prescription cards — fadeSlideUp, 150ms stagger
 * Beat 4 (1.50s): Bottom CTA — scaleIn
 */

export function PrescriptionSection({ stages, onBookCall }: PrescriptionSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const prescriptions = useMemo(() => generatePrescriptions(stages, 5), [stages]);

  useGSAP(() => {
    if (prescriptions.length === 0) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    const headline = clipReveal();
    tl.fromTo('[data-rx="headline"]', headline.from, headline.vars, 0);

    const subtitle = fadeSlideUp();
    tl.fromTo('[data-rx="subtitle"]', subtitle.from, subtitle.vars, 0.3);

    const cards = fadeSlideUp({ stagger: 0.15 });
    tl.fromTo('[data-rx="card"]', cards.from, cards.vars, 0.5);

    const cta = scaleIn();
    tl.fromTo('[data-rx="cta"]', cta.from, cta.vars, 1.5);
  }, { scope: containerRef, dependencies: [prescriptions.length] });

  // Don't render if no prescriptions (all findings are positive)
  if (prescriptions.length === 0) return null;

  const criticalCount = prescriptions.filter((p) => p.severity === 'critical').length;

  return (
    <section ref={containerRef} className="space-y-8">
      {/* Section Header */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-12 h-1 bg-forge-accent" />
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-forge-accent uppercase">
            Custom Growth Prescription
          </span>
        </div>
        <h2
          data-rx="headline"
          className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-forge-text"
        >
          Your Fix <br className="md:hidden" />
          <span className="text-forge-accent">Protocol</span>
        </h2>
        <p
          data-rx="subtitle"
          className="mt-4 text-forge-text-secondary leading-relaxed max-w-2xl"
        >
          Based on your scan, {prescriptions.length} high-impact fixes have been identified
          {criticalCount > 0 && <> — <span className="font-bold text-forge-accent">{criticalCount} critical</span></>}.
          Each prescription includes exactly what to fix, why it matters, and the expected outcome.
        </p>
      </header>

      {/* Prescription Cards */}
      <div className="space-y-4 md:space-y-5">
        {prescriptions.map((rx, i) => (
          <PrescriptionCard
            key={rx.id}
            prescription={rx}
            index={i}
            onGetFixed={onBookCall}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div
        data-rx="cta"
        className="p-6 sm:p-8 md:p-10 rounded-xl text-white relative overflow-hidden bg-gradient-to-br from-forge-accent to-[#ff7a3d] shadow-2xl shadow-forge-accent/20"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-9xl">clinical_notes</span>
        </div>
        <div className="relative z-10 md:flex md:items-center md:justify-between md:gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 block mb-2 font-bold">
              {prescriptions.length} Fixes Identified
            </span>
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-none mb-2">
              Get All Fixes in One Call
            </h3>
            <p className="text-sm text-white/90 leading-relaxed max-w-lg mb-6 md:mb-0">
              Walk through every prescription with our team. We&apos;ll build a custom implementation
              timeline and get started on the highest-impact fixes immediately.
            </p>
          </div>
          <button
            onClick={onBookCall}
            className="w-full md:w-auto md:shrink-0 md:px-10 bg-[#FEFEFE] text-forge-accent py-4 font-mono font-black text-xs uppercase tracking-[0.2em] rounded-lg active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            Book Strategy Call
          </button>
        </div>
      </div>
    </section>
  );
}
