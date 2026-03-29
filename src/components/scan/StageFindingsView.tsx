'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { FunnelStage, Annotation, AnnotationType, StageFinding } from '../../../contracts/types';
import type { StageState, ScreenshotEntry } from './types';
import { fadeSlideUp, scaleIn } from '@/lib/gsap-presets';
import { AnnotationPopover } from './AnnotationPopover';

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic Sources',
  landing: 'Landing Experience',
  capture: 'Lead Capture',
  offer: 'Offer & Conversion',
  followup: 'Follow-Up System',
};

const SEVERITY_CONFIG: Record<AnnotationType, { label: string; bgClass: string; textClass: string; borderClass: string; icon: string }> = {
  critical: { label: 'Critical', bgClass: 'bg-forge-accent/10', textClass: 'text-forge-accent', borderClass: 'border-forge-accent', icon: 'report' },
  warning: { label: 'Warning', bgClass: 'bg-forge-warning/10', textClass: 'text-forge-warning', borderClass: 'border-forge-warning', icon: 'warning' },
  opportunity: { label: 'Good', bgClass: 'bg-forge-opportunity/10', textClass: 'text-forge-opportunity', borderClass: 'border-forge-opportunity', icon: 'check_circle' },
  positive: { label: 'Good', bgClass: 'bg-forge-positive/10', textClass: 'text-forge-positive', borderClass: 'border-forge-positive', icon: 'check_circle' },
};

interface StageFindingsViewProps {
  stage: FunnelStage;
  stageState: StageState | undefined;
  screenshots: ScreenshotEntry[];
  onInitiateFix: () => void;
}

/* ANIMATION SEQUENCE:
 * Beat 1 (0.00s): Score card — scaleIn
 * Beat 2 (0.20s): Summary — fadeSlideUp
 * Beat 3 (0.40s): Browser mockup — scaleIn
 * Beat 4 (0.80s): Annotation dots — scale+opacity stagger
 * Beat 5 (0.80s): Findings — fadeSlideUp, 100ms stagger
 * Beat 6 (1.60s): CTA — scaleIn
 */

export function StageFindingsView({ stage, stageState, screenshots, onInitiateFix }: StageFindingsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);

  const score = stageState?.summary?.score ?? 0;
  const severityLabel = score >= 70 ? 'Strong' : score >= 40 ? 'Weak' : 'Critical';
  const headline = stageState?.summary?.headline ?? '';
  const findings: StageFinding[] = stageState?.summary?.findings ?? [];

  // Use the first desktop screenshot as the primary display
  const primaryScreenshot = screenshots.find((s) => s.viewport === 'desktop') ?? screenshots[0];

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    const card = scaleIn();
    tl.fromTo('[data-sf="score"]', card.from, card.vars, 0);

    const summary = fadeSlideUp();
    tl.fromTo('[data-sf="summary"]', summary.from, summary.vars, 0.2);

    const mockup = scaleIn();
    tl.fromTo('[data-sf="mockup"]', mockup.from, mockup.vars, 0.4);

    // Annotation dots stagger
    tl.from('[data-sf-dot]', {
      scale: 0,
      opacity: 0,
      duration: 0.4,
      stagger: 0.15,
      ease: 'back.out(1.7)',
    }, 0.8);

    const findingItems = fadeSlideUp({ stagger: 0.1 });
    tl.fromTo('[data-sf="finding"]', findingItems.from, findingItems.vars, 0.8);

    const cta = scaleIn();
    tl.fromTo('[data-sf="cta"]', cta.from, cta.vars, 1.6);
  }, { scope: containerRef, dependencies: [stage] });

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Score Hero */}
      <section className="space-y-6">
        <div
          data-sf="score"
          className="flex items-end gap-4 bg-forge-accent p-6 rounded-xl text-white shadow-xl shadow-forge-accent/20"
        >
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 mb-1">Audit Score</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-7xl leading-none text-white">{score}</span>
              <span className="font-display text-2xl text-white/50">/100</span>
            </div>
          </div>
          <div className="pb-2">
            <span className="bg-[#FEFEFE] text-forge-accent px-3 py-1 rounded-sm font-mono text-xs font-bold uppercase tracking-tighter border-l-4 border-forge-accent">
              {severityLabel}
            </span>
          </div>
        </div>

        {/* Summary Card */}
        {headline && (
          <div data-sf="summary" className="bg-forge-surface p-6 border-l-4 border-forge-accent shadow-sm">
            <p className="font-display font-bold text-xl leading-tight">{headline}</p>
          </div>
        )}
      </section>

      {/* Browser Mockup & Visual Audit */}
      {primaryScreenshot && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-forge-text-secondary">
              Visual Context
            </h3>
          </div>
          <div
            data-sf="mockup"
            className="relative bg-forge-card rounded-xl overflow-hidden shadow-2xl border border-forge-accent/20 forge-glow"
          >
            {/* Browser Chrome Bar */}
            <div className="bg-forge-elevated h-9 flex items-center px-3 gap-2 shrink-0">
              <div className="flex gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-forge-accent/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-forge-warning/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-forge-positive/40" />
              </div>
              <div className="flex-1 bg-[#FEFEFE] h-5 rounded px-2 flex items-center justify-between border border-forge-card overflow-hidden">
                <span className="font-mono text-[9px] text-forge-text-secondary truncate leading-none">
                  {primaryScreenshot.source}
                </span>
                <span className="material-symbols-outlined text-[12px] text-forge-accent shrink-0 ml-1">lock</span>
              </div>
            </div>

            {/* Scrollable screenshot viewport — phone-screen height, user scrolls to see full page */}
            <div className="max-h-[480px] overflow-y-auto overscroll-contain">
              {/* Screenshot with Annotation Dots — relative wrapper matches full image size for % positioning */}
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={primaryScreenshot.thumbnailUrl}
                  alt={`${STAGE_LABELS[stage]} screenshot`}
                  className="w-full block"
                  loading="lazy"
                />
                {/* Annotation dots — positioned relative to full image dimensions */}
                {primaryScreenshot.annotations.map((annotation, i) => (
                  <button
                    key={annotation.id}
                    data-sf-dot=""
                    onClick={() => setActiveAnnotation(
                      activeAnnotation?.id === annotation.id ? null : annotation
                    )}
                    className={`absolute w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-lg cursor-pointer z-10 ${
                      annotation.type === 'critical' || annotation.type === 'warning'
                        ? 'bg-forge-accent shadow-[0_0_12px_rgba(232,83,14,0.6)]'
                        : annotation.type === 'positive'
                          ? 'bg-forge-positive shadow-[0_0_12px_rgba(45,140,78,0.6)]'
                          : 'bg-forge-opportunity shadow-[0_0_12px_rgba(43,123,212,0.6)]'
                    }`}
                    style={{
                      left: `${annotation.position.x}%`,
                      top: `${annotation.position.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Active popover */}
                {activeAnnotation && (
                  <AnnotationPopover
                    annotation={activeAnnotation}
                    onClose={() => setActiveAnnotation(null)}
                  />
                )}
              </div>
            </div>
            {/* Scroll hint — subtle gradient at bottom of viewport */}
            <div className="h-6 bg-gradient-to-t from-forge-card to-transparent -mt-6 relative z-[5] pointer-events-none" />
          </div>
        </section>
      )}

      {/* Detailed Findings List */}
      {findings.length > 0 && (
        <section className="space-y-8">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-forge-text-secondary">
            Detailed Findings ({findings.length})
          </h3>
          <div className="space-y-4">
            {findings.map((finding, i) => {
              const config = SEVERITY_CONFIG[finding.type];
              const isCritical = finding.type === 'critical';
              return (
                <div
                  key={finding.id}
                  data-sf="finding"
                  className={`bg-[#FEFEFE] p-5 flex gap-4 relative overflow-hidden ${
                    isCritical ? 'border border-forge-accent/10' : ''
                  }`}
                >
                  {/* Forge Stripe — 1.5px for critical, 1px for others */}
                  <div className={`absolute left-0 top-0 bottom-0 ${isCritical ? 'w-1.5 bg-forge-accent' : `w-1 ${config.borderClass.replace('border-', 'bg-')}`}`} />
                  {/* Index number */}
                  <div className={`font-display text-2xl opacity-40 ${config.textClass}`}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`${config.bgClass} ${config.textClass} text-[10px] font-mono px-2 py-0.5 font-bold uppercase`}>
                        {config.label}
                      </span>
                      <span className={`material-symbols-outlined ${config.textClass}`}>
                        {config.icon}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-lg leading-snug">{finding.title}</h4>
                    <p className="text-sm text-forge-text-secondary leading-relaxed font-body">{finding.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section
        data-sf="cta"
        className="text-white p-8 rounded-xl space-y-6 shadow-2xl shadow-forge-accent/30 relative overflow-hidden bg-gradient-to-br from-forge-accent to-[#ff7a3d]"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-9xl">construction</span>
        </div>
        <div className="relative z-10">
          <h4 className="font-display font-bold text-3xl tracking-tight">Ready to Forge?</h4>
          <p className="text-sm text-white/90 leading-relaxed mt-2 max-w-[80%]">
            Our builders are ready to refactor these findings into a high-converting {STAGE_LABELS[stage].toLowerCase()}. Stop leaking pipeline today.
          </p>
          <button
            onClick={onInitiateFix}
            className="w-full bg-[#FEFEFE] text-forge-accent py-4 font-black tracking-[0.2em] text-xs uppercase rounded-lg active:scale-95 transition-all mt-6 shadow-xl shadow-black/10"
          >
            INITIATE REFACTOR
          </button>
        </div>
      </section>
    </div>
  );
}
