'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { ScanCompletedSummary } from '../../../contracts/events';
import { fadeSlideUp, scaleIn } from '@/lib/gsap-presets';

interface HealthPotentialProps {
  summary: ScanCompletedSummary;
  onInitiateOptimization: () => void;
}

/* ANIMATION SEQUENCE:
 * Beat 1 (0.00s): Score card — scaleIn
 * Beat 2 (0.20s): Stats grid — fadeSlideUp, 100ms stagger
 * Beat 3 (0.50s): Transformation section — fadeSlideUp
 * Beat 4 (1.00s): CTA card — scaleIn
 */

export function HealthPotential({ summary, onInitiateOptimization }: HealthPotentialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const projectedScore = Math.min(summary.overallHealth + 45, 100);
  const improvement = projectedScore - summary.overallHealth;

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    const card = scaleIn();
    tl.fromTo('[data-hp="score"]', card.from, card.vars, 0);

    // Score count-up animation
    const counter = { value: 0 };
    tl.to(counter, {
      value: summary.overallHealth,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (scoreRef.current) {
          scoreRef.current.textContent = Math.round(counter.value).toString();
        }
      },
    }, 0.1);

    const stats = fadeSlideUp({ stagger: 0.1 });
    tl.fromTo('[data-hp="stat"]', stats.from, stats.vars, 0.2);

    const transform = fadeSlideUp();
    tl.fromTo('[data-hp="transform"]', transform.from, transform.vars, 0.5);

    const cta = scaleIn();
    tl.fromTo('[data-hp="cta"]', cta.from, cta.vars, 1.0);
  }, { scope: containerRef, dependencies: [summary.overallHealth] });

  return (
    <div ref={containerRef} className="space-y-12">
      {/* Health Score Card */}
      <section>
        <div
          data-hp="score"
          className="bg-forge-accent p-6 sm:p-8 rounded-xl text-white shadow-xl shadow-forge-accent/15 relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 opacity-10">
            <span className="material-symbols-outlined text-9xl">analytics</span>
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 mb-6">
              Current Health Index
            </span>
            <div className="flex items-baseline gap-1 mb-6">
              <span ref={scoreRef} className="font-display text-6xl sm:text-8xl leading-none text-white drop-shadow-sm">
                0
              </span>
              <span className="font-display text-2xl text-white/40">/100</span>
            </div>
            <div className="bg-[#FEFEFE] text-forge-accent px-4 py-1.5 rounded-sm font-mono text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-forge-accent">
              <span
                className="material-symbols-outlined text-xs"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              Critical Optimization Required
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-3 md:gap-5">
        <div data-hp="stat" className="bg-forge-surface p-4 flex flex-col gap-1 border border-forge-card rounded-lg">
          <span className="font-mono text-[10px] uppercase opacity-60 font-bold tracking-tighter">Found</span>
          <span className="font-display text-3xl font-black text-forge-text">
            {String(summary.stagesFound).padStart(2, '0')}
          </span>
        </div>
        <div data-hp="stat" className="bg-forge-surface p-4 flex flex-col gap-1 border border-forge-accent/20 rounded-lg">
          <span className="font-mono text-[10px] uppercase text-forge-accent font-bold tracking-tighter">Missing</span>
          <span className="font-display text-3xl font-black text-forge-accent">
            {String(summary.stagesMissing).padStart(2, '0')}
          </span>
        </div>
        <div data-hp="stat" className="bg-forge-critical p-4 flex flex-col gap-1 rounded-lg">
          <span className="font-mono text-[10px] uppercase text-white/70 font-bold tracking-tighter">Issues</span>
          <span className="font-display text-3xl font-black text-white">
            {String(summary.criticalIssues).padStart(2, '0')}
          </span>
        </div>
      </section>

      {/* Transformation Potential */}
      <section data-hp="transform">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-8 h-1 bg-forge-accent rounded-full" />
          <h2 className="font-display text-xl font-black uppercase tracking-tighter">Transformation Potential</h2>
        </div>
        <div className="space-y-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-6 md:space-y-0 md:items-stretch">
          {/* Status Quo Card */}
          <div className="bg-forge-surface p-6 rounded-xl border-l-4 border-forge-text-secondary/30 relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-forge-text-secondary/60 block mb-1">
                  Status Quo
                </span>
                <h3 className="font-bold text-lg leading-tight uppercase font-display">
                  Current Funnel<br />Performance
                </h3>
              </div>
              <span className="font-display text-2xl font-black text-forge-text-secondary/30">
                {summary.overallHealth}%
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-forge-text-secondary/70">
                <span className="material-symbols-outlined text-base">close</span>
                <span className="font-medium">{summary.criticalIssues} Critical Issues Unresolved</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-forge-text-secondary/70">
                <span className="material-symbols-outlined text-base">close</span>
                <span className="font-medium">{summary.stagesMissing} Missing Funnel Stages</span>
              </div>
            </div>
          </div>

          {/* Arrow Bridge — vertical on mobile, horizontal on desktop */}
          <div className="flex justify-center -my-3 md:my-0 md:items-center relative z-10">
            <div className="bg-forge-accent text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg shadow-forge-accent/30 ring-4 ring-forge-base">
              <span className="material-symbols-outlined font-bold md:hidden">south</span>
              <span className="material-symbols-outlined font-bold hidden md:block">east</span>
            </div>
          </div>

          {/* Forge-Optimized Card */}
          <div className="bg-forge-base p-6 rounded-xl border border-forge-accent/10 relative overflow-hidden forge-glow">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-forge-accent" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="font-mono text-[10px] uppercase text-forge-accent font-bold block mb-1">
                  Forge-Optimized
                </span>
                <h3 className="font-bold text-lg leading-tight uppercase font-display">
                  Unified Logic &amp;<br />AI Auto-Scaling
                </h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-display text-3xl font-black text-forge-accent">{projectedScore}%</span>
                <span className="font-mono text-[10px] text-forge-accent font-bold">+{improvement}pts</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-forge-text">
                <span
                  className="material-symbols-outlined text-forge-accent"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span className="font-bold">All {summary.stagesMissing} Missing Stages Implemented</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-forge-text">
                <span
                  className="material-symbols-outlined text-forge-accent"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span className="font-bold">Critical Issues Resolved</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audit Verdict CTA */}
      <section
        data-hp="cta"
        className="bg-gradient-to-br from-forge-accent to-[#ff7a3d] p-8 md:p-10 rounded-2xl text-white relative overflow-hidden shadow-2xl shadow-forge-accent/30"
      >
        <div className="absolute inset-0 inner-grid-pattern opacity-40 pointer-events-none" />
        <div className="relative z-10 md:flex md:items-center md:justify-between md:gap-12">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-80 block mb-2 font-bold">
              Audit Verdict
            </span>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">
              Projected Score Improvement
            </h2>
            <p className="font-body text-sm text-white/90 mb-8 md:mb-0 leading-relaxed max-w-lg">
              By activating the {summary.stagesMissing} missing architectural stages, your ecosystem can leap from{' '}
              {summary.overallHealth} to {projectedScore} in the next audit cycle.
            </p>
          </div>
          <button
            onClick={onInitiateOptimization}
            className="w-full md:w-auto md:shrink-0 md:px-10 bg-[#FEFEFE] text-forge-accent font-mono py-5 rounded-lg font-black uppercase tracking-widest text-xs active:scale-95 transition-all duration-200 shadow-xl shadow-black/10"
          >
            Book a Strategy Call
          </button>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10">
          <span className="material-symbols-outlined text-[160px]">construction</span>
        </div>
      </section>
    </div>
  );
}
