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
          className="font-display text-5xl font-black uppercase tracking-tighter leading-[0.9] text-forge-accent"
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

      {/* Forge Summary Dark Card */}
      <div
        data-ir="summary"
        className="mt-12 p-6 bg-forge-text text-forge-base rounded-xl shadow-2xl ring-1 ring-white/10"
      >
        <h5 className="font-mono text-xs font-bold uppercase tracking-[0.2em] mb-4 opacity-70">
          The Forge Summary
        </h5>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="font-display text-6xl font-black text-forge-accent leading-none drop-shadow-[0_0_15px_rgba(232,83,14,0.6)]">
            {String(critical.length).padStart(2, '0')}
          </span>
          <div className="font-mono text-[10px] leading-tight uppercase font-bold">
            Critical Blocks<br />To Resolve
          </div>
        </div>
        <button
          onClick={onForgeSolution}
          className="w-full forge-gradient-primary py-4 rounded-lg font-mono font-bold text-sm tracking-widest uppercase text-white shadow-[0_10px_20px_-5px_rgba(232,83,14,0.4)] active:scale-[0.98] transition-transform"
        >
          FORGE THE SOLUTION
        </button>
      </div>
    </div>
  );
}
