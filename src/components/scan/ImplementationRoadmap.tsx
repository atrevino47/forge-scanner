'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { FunnelStage, StageFinding } from '../../../contracts/types';
import type { StageState } from './types';
import { fadeSlideUp, clipReveal, scaleIn } from '@/lib/gsap-presets';

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic',
  landing: 'Landing',
  capture: 'Capture',
  offer: 'Offer',
  followup: 'Follow-up',
};

interface RoadmapFinding extends StageFinding {
  stage: FunnelStage;
}

interface ImplementationRoadmapProps {
  stages: Partial<Record<FunnelStage, StageState>>;
  onForgeSolution: () => void;
}

/* ANIMATION SEQUENCE:
 * Beat 1 (0.00s): Headline — clipReveal
 * Beat 2 (0.30s): Finding cards — fadeSlideUp, 120ms stagger
 * Beat 3 (1.20s): Forge Summary — scaleIn
 */

export function ImplementationRoadmap({ stages, onForgeSolution }: ImplementationRoadmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Collect all findings across stages, tagged with their stage
  const allFindings: RoadmapFinding[] = [];
  const stageOrder: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];
  for (const stage of stageOrder) {
    const stageState = stages[stage];
    if (stageState?.summary) {
      for (const finding of stageState.summary.findings) {
        allFindings.push({ ...finding, stage });
      }
    }
  }

  // Group by severity
  const critical = allFindings.filter((f) => f.type === 'critical');
  const warnings = allFindings.filter((f) => f.type === 'warning');
  const good = allFindings.filter((f) => f.type === 'positive' || f.type === 'opportunity');

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    const headline = clipReveal();
    tl.fromTo('[data-ir="headline"]', headline.from, headline.vars, 0);

    const cards = fadeSlideUp({ stagger: 0.12 });
    tl.fromTo('[data-ir="card"]', cards.from, cards.vars, 0.3);

    const summary = scaleIn();
    tl.fromTo('[data-ir="summary"]', summary.from, summary.vars, 1.2);
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="pb-8">
      {/* Section Header */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-12 h-1 bg-forge-accent" />
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-forge-accent uppercase">
            Implementation Roadmap
          </span>
        </div>
        <h2
          data-ir="headline"
          className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-forge-accent"
        >
          What to Fix First
        </h2>
        <p className="mt-4 text-forge-text-secondary leading-relaxed">
          Prioritized engineering backlog based on structural integrity and growth potential.
        </p>
      </header>

      {/* Critical Section */}
      {critical.length > 0 && (
        <section className="mb-10 relative">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-forge-accent"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                report
              </span>
              <h3 className="font-mono font-bold text-sm tracking-widest uppercase text-forge-accent">Critical</h3>
            </div>
            <div className="bg-forge-accent text-white px-3 py-1 rounded-sm flex items-center gap-2 shadow-md">
              <span className="material-symbols-outlined text-xs">arrow_downward</span>
              <span className="font-mono text-[10px] font-bold">START HERE</span>
            </div>
          </div>
          <div className="space-y-4">
            {critical.map((finding, i) => (
              <div
                key={finding.id}
                data-ir="card"
                className="bg-[#FEFEFE] p-5 border-l-4 border-forge-accent relative overflow-hidden shadow-sm ring-1 ring-forge-accent/10"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[10px] text-forge-text-secondary tracking-tighter uppercase font-bold">
                    Stage: {STAGE_LABELS[finding.stage]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-sm font-mono text-[9px] font-bold uppercase ${
                    finding.impact === 'high'
                      ? 'bg-forge-critical/10 text-forge-critical'
                      : 'bg-forge-accent/10 text-forge-accent'
                  }`}>
                    {finding.impact === 'high' ? 'High Effort' : 'Quick Win'}
                  </span>
                </div>
                <h4 className="font-bold text-lg leading-tight mb-2">{finding.title}</h4>
                <p className="text-sm text-forge-text-secondary mb-4">{finding.detail}</p>
                {i === 0 && (
                  <div className="flex items-center gap-2 text-forge-accent">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bolt
                    </span>
                    <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
                      Immediate Fix Required
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Warning Section */}
      {warnings.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-forge-warning"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <h3 className="font-mono font-bold text-sm tracking-widest uppercase">Warning</h3>
          </div>
          <div className="space-y-4">
            {warnings.map((finding) => (
              <div key={finding.id} data-ir="card" className="bg-forge-surface p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[10px] text-forge-text-secondary tracking-tighter uppercase">
                    Stage: {STAGE_LABELS[finding.stage]}
                  </span>
                  <span className="bg-forge-card text-forge-text px-2 py-0.5 rounded-sm font-mono text-[9px] font-bold uppercase">
                    Medium Effort
                  </span>
                </div>
                <h4 className="font-bold text-lg leading-tight mb-2">{finding.title}</h4>
                <p className="text-sm text-forge-text-secondary mb-4">{finding.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Working Well Section */}
      {good.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-forge-opportunity"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h3 className="font-mono font-bold text-sm tracking-widest uppercase">Working Well</h3>
          </div>
          <div className="space-y-4">
            {good.map((finding) => (
              <div key={finding.id} data-ir="card" className="bg-forge-surface/50 p-5 opacity-70">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[10px] text-forge-text-secondary tracking-tighter uppercase">
                    Stage: {STAGE_LABELS[finding.stage]}
                  </span>
                  <span className="bg-forge-opportunity/10 text-forge-opportunity px-2 py-0.5 rounded-sm font-mono text-[9px] font-bold uppercase">
                    Optimized
                  </span>
                </div>
                <h4 className="font-bold text-lg leading-tight mb-2">{finding.title}</h4>
                <p className="text-sm text-forge-text-secondary mb-4">{finding.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA — orange gradient card (spec: same style as stage CTA) */}
      <div
        data-ir="summary"
        className="mt-12 p-6 sm:p-8 text-white rounded-xl shadow-2xl shadow-forge-accent/30 relative overflow-hidden bg-gradient-to-br from-forge-accent to-[#ff7a3d]"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-9xl">construction</span>
        </div>
        <div className="relative z-10">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 block mb-2 font-bold">
            Implementation Plan Ready
          </span>
          <h5 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight mb-2">
            Forge Your Solution
          </h5>
          <p className="text-sm text-white/90 leading-relaxed mb-6">
            {critical.length > 0
              ? `${critical.length} critical issue${critical.length === 1 ? '' : 's'} identified. Our builders are ready to resolve them and rebuild your funnel.`
              : 'Let our builders turn these insights into a high-converting funnel system.'}
          </p>
          <button
            onClick={onForgeSolution}
            className="w-full bg-[#FEFEFE] text-forge-accent py-4 font-mono font-black text-xs uppercase tracking-[0.2em] rounded-lg active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            FORGE THE SOLUTION
          </button>
        </div>
      </div>
    </div>
  );
}
