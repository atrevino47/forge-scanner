'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { FunnelStage } from '../../../contracts/types';
import type { ScreenshotEntry, StageState } from './types';
import { fadeSlideUp } from '@/lib/gsap-presets';
import { ScreenshotCard } from './ScreenshotCard';
import { SkeletonLoader } from './SkeletonLoader';

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic & Discovery',
  landing: 'Landing Experience',
  capture: 'Lead Capture',
  offer: 'Offer & Conversion',
  followup: 'Follow-Up & Nurture',
};

interface StageSectionProps {
  stage: FunnelStage;
  stageState?: StageState;
  screenshots: ScreenshotEntry[];
}

export function StageSection({
  stage,
  stageState,
  screenshots,
}: StageSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE (scroll-triggered at 85% viewport):
   * Beat 1 (0.00s): Stage header — fadeSlideUp
   * Beat 2 (0.15s): Screenshot cards — fadeSlideUp, 150ms stagger
   * Beat 3 (0.40s): Stage summary — fadeSlideUp
   */
  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });

      const header = fadeSlideUp();
      tl.fromTo(
        '[data-stage="header"]',
        header.from,
        header.vars,
        0,
      );

      const cards = fadeSlideUp({ stagger: 0.15 });
      tl.fromTo(
        '[data-stage="card"]',
        cards.from,
        cards.vars,
        0.15,
      );

      if (stageState?.summary) {
        const summary = fadeSlideUp();
        tl.fromTo(
          '[data-stage="summary"]',
          summary.from,
          summary.vars,
          0.4,
        );
      }
    },
    {
      scope: containerRef,
      dependencies: [screenshots.length, stageState?.status],
    },
  );

  const isAnalyzing = stageState?.status === 'analyzing';
  const isCompleted = stageState?.status === 'completed';

  return (
    <section ref={containerRef} className="py-12">
      {/* Stage header */}
      <div
        data-stage="header"
        className="mb-6 flex items-center gap-3"
      >
        <h2 className="font-display text-2xl tracking-display text-forge-text">
          {STAGE_LABELS[stage]}
        </h2>
        {isAnalyzing && (
          <span className="rounded-full bg-forge-accent/10 px-3 py-1 text-xs font-medium text-forge-accent">
            Analyzing...
          </span>
        )}
        {isCompleted && (
          <span className="rounded-full bg-forge-positive/10 px-3 py-1 text-xs font-medium text-forge-positive">
            Complete
          </span>
        )}
      </div>

      {/* Screenshots grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {screenshots.map((ss) => (
          <div key={ss.id} data-stage="card">
            <ScreenshotCard screenshot={ss} />
          </div>
        ))}
        {isAnalyzing && screenshots.length === 0 && (
          <div data-stage="card">
            <SkeletonLoader className="h-64" />
          </div>
        )}
      </div>

      {/* Stage summary */}
      {stageState?.summary && (
        <div
          data-stage="summary"
          className="glass-card mt-6 rounded-xl p-6"
        >
          <p className="font-body text-base font-medium text-forge-text">
            {stageState.summary.headline}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="font-mono text-sm text-forge-accent">
              Score: {stageState.summary.score}/100
            </span>
            <span className="text-sm text-forge-text-muted">
              {stageState.summary.findings.length} findings
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
