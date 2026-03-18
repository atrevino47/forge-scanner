'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { ScanCompletedSummary } from '../../../contracts/events';
import { fadeSlideUp, scaleIn } from '@/lib/gsap-presets';
import {
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

interface FunnelHealthSummaryProps {
  summary: ScanCompletedSummary;
}

export function FunnelHealthSummary({
  summary,
}: FunnelHealthSummaryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  /* ANIMATION SEQUENCE (scroll-triggered at 80% viewport):
   * Beat 1 (0.00s): Container — scaleIn
   * Beat 2 (0.20s): Score count-up — GSAP tween 0→target over 1.5s
   * Beat 3 (0.30s): Stat cards — fadeSlideUp, 100ms stagger
   * Beat 4 (0.50s): Top finding — fadeSlideUp
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

      const container = scaleIn();
      tl.fromTo(
        '[data-health="container"]',
        container.from,
        container.vars,
        0,
      );

      // Score count-up
      const counter = { value: 0 };
      tl.to(
        counter,
        {
          value: summary.overallHealth,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            if (scoreRef.current) {
              scoreRef.current.textContent = Math.round(
                counter.value,
              ).toString();
            }
          },
        },
        0.2,
      );

      const stats = fadeSlideUp({ stagger: 0.1 });
      tl.fromTo(
        '[data-health="stat"]',
        stats.from,
        stats.vars,
        0.3,
      );

      const finding = fadeSlideUp();
      tl.fromTo(
        '[data-health="finding"]',
        finding.from,
        finding.vars,
        0.5,
      );
    },
    { scope: containerRef },
  );

  // Color the score based on health
  const scoreColor =
    summary.overallHealth >= 70
      ? 'text-forge-positive'
      : summary.overallHealth >= 40
        ? 'text-forge-warning'
        : 'text-forge-critical';

  return (
    <div ref={containerRef} className="py-12">
      <div
        data-health="container"
        className="glass-card rounded-xl p-8"
      >
        {/* Score header */}
        <div className="mb-8 text-center">
          <p className="mb-2 font-body text-sm font-medium uppercase tracking-wide text-forge-text-muted">
            Funnel Health Score
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span
              ref={scoreRef}
              className={`font-display text-6xl tracking-display ${scoreColor}`}
            >
              0
            </span>
            <span className="font-mono text-lg text-forge-text-muted">
              /100
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div
            data-health="stat"
            className="rounded-lg bg-forge-surface p-4 text-center"
          >
            <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-forge-positive" />
            <p className="font-mono text-lg text-forge-text">
              {summary.stagesFound}
            </p>
            <p className="text-xs text-forge-text-muted">
              Stages found
            </p>
          </div>
          <div
            data-health="stat"
            className="rounded-lg bg-forge-surface p-4 text-center"
          >
            <BarChart3 className="mx-auto mb-2 h-5 w-5 text-forge-warning" />
            <p className="font-mono text-lg text-forge-text">
              {summary.stagesMissing}
            </p>
            <p className="text-xs text-forge-text-muted">
              Stages missing
            </p>
          </div>
          <div
            data-health="stat"
            className="rounded-lg bg-forge-surface p-4 text-center"
          >
            <AlertTriangle className="mx-auto mb-2 h-5 w-5 text-forge-critical" />
            <p className="font-mono text-lg text-forge-text">
              {summary.criticalIssues}
            </p>
            <p className="text-xs text-forge-text-muted">
              Critical issues
            </p>
          </div>
        </div>

        {/* Top finding */}
        {summary.topFinding && (
          <div
            data-health="finding"
            className="rounded-lg border border-forge-border bg-forge-surface/50 p-4"
          >
            <p className="mb-1 text-xs font-medium uppercase text-forge-accent">
              Top Finding
            </p>
            <p className="font-body text-sm leading-relaxed text-forge-text">
              {summary.topFinding}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
