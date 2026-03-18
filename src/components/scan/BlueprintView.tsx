'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { BlueprintData, FunnelMapNode } from '../../../contracts/types';
import { fadeSlideUp, scaleIn } from '@/lib/gsap-presets';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  CircleAlert,
  CircleCheck,
  CircleMinus,
} from 'lucide-react';

interface BlueprintViewProps {
  blueprint: BlueprintData;
}

// ── Health color mapping ──
const HEALTH_BG: Record<string, string> = {
  good: 'border-forge-positive/30 bg-forge-positive/5',
  weak: 'border-forge-warning/30 bg-forge-warning/5',
  missing: 'border-forge-critical/30 bg-forge-critical/5',
};
const HEALTH_ICON_COLOR: Record<string, string> = {
  good: 'text-forge-positive',
  weak: 'text-forge-warning',
  missing: 'text-forge-critical',
};
const HEALTH_ICON = {
  good: CircleCheck,
  weak: CircleAlert,
  missing: CircleMinus,
} as const;

export function BlueprintView({ blueprint }: BlueprintViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* ANIMATION SEQUENCE:
   * Beat 1 (0.00s): Section heading — fadeSlideUp
   * Beat 2 (0.20s): Funnel map nodes — fadeSlideUp, 120ms stagger
   * Beat 3 (0.80s): Revenue impact — scaleIn
   * Beat 4 (1.20s): Mockup preview — fadeSlideUp
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

      const heading = fadeSlideUp();
      tl.fromTo(
        '[data-bp="heading"]',
        heading.from,
        heading.vars,
        0,
      );

      const nodes = fadeSlideUp({ stagger: 0.12 });
      tl.fromTo(
        '[data-bp="node"]',
        nodes.from,
        nodes.vars,
        0.2,
      );

      const impact = scaleIn();
      tl.fromTo(
        '[data-bp="impact"]',
        impact.from,
        impact.vars,
        0.8,
      );

      const mockup = fadeSlideUp();
      tl.fromTo(
        '[data-bp="mockup"]',
        mockup.from,
        mockup.vars,
        1.2,
      );
    },
    { scope: containerRef },
  );

  const { funnelMap, mockupHtml, mockupTarget } = blueprint;

  return (
    <div ref={containerRef} className="py-12">
      <h2
        data-bp="heading"
        className="font-display mb-8 text-center tracking-display leading-display"
        style={{ fontSize: 'clamp(1.8rem, 3vw + 0.5rem, 2.5rem)' }}
      >
        [COPY: your optimized funnel blueprint]
      </h2>

      {/* ── Funnel Map ── */}
      <div className="mx-auto mb-10 max-w-[960px] space-y-4">
        {funnelMap.nodes.map((node, i) => (
          <FunnelStageNode
            key={node.stage}
            node={node}
            isLast={i === funnelMap.nodes.length - 1}
          />
        ))}
      </div>

      {/* ── Revenue Impact ── */}
      <div
        data-bp="impact"
        className="glass-card mx-auto mb-10 max-w-[960px] rounded-xl p-6 text-center"
      >
        <p className="mb-1 text-xs font-medium uppercase text-forge-accent">
          Revenue Impact Estimate
        </p>
        <p className="font-body text-base leading-relaxed text-forge-text">
          {funnelMap.revenueImpactEstimate}
        </p>
      </div>

      {/* ── Mockup Preview ── */}
      {mockupHtml && (
        <div data-bp="mockup" className="mx-auto max-w-[960px]">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-body text-sm font-medium text-forge-text-muted">
              Optimized mockup: {mockupTarget}
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-forge-border">
            <iframe
              srcDoc={mockupHtml}
              sandbox="allow-same-origin"
              className="w-full bg-forge-card"
              style={{ height: 600 }}
              title="Optimized mockup preview"
            />
            {/* Watermark overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-forge-base/80 to-transparent py-4">
              <span className="font-display text-sm tracking-display text-forge-text-muted/60">
                Built by FORGE<span className="text-forge-accent/60">.</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual funnel stage node ──
function FunnelStageNode({
  node,
  isLast,
}: {
  node: FunnelMapNode;
  isLast: boolean;
}) {
  const Icon = HEALTH_ICON[node.health];

  return (
    <>
      <div
        data-bp="node"
        className={cn(
          'rounded-xl border p-5',
          HEALTH_BG[node.health],
        )}
      >
        <div className="mb-3 flex items-center gap-3">
          <Icon
            className={cn('h-5 w-5', HEALTH_ICON_COLOR[node.health])}
          />
          <h3 className="font-display text-lg tracking-display text-forge-text">
            {node.label}
          </h3>
          {!node.exists && (
            <span className="rounded-full bg-forge-critical/10 px-2 py-0.5 text-[10px] font-medium uppercase text-forge-critical">
              Missing
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Current state */}
          <div className="rounded-lg bg-forge-surface/50 p-3">
            <p className="mb-1 text-[10px] font-medium uppercase text-forge-text-muted">
              Current
            </p>
            <p className="font-body text-sm text-forge-text-muted">
              {node.currentDescription}
            </p>
          </div>
          {/* Ideal state */}
          <div className="rounded-lg bg-forge-accent/5 p-3">
            <p className="mb-1 text-[10px] font-medium uppercase text-forge-accent">
              Optimized
            </p>
            <p className="font-body text-sm text-forge-text">
              {node.idealDescription}
            </p>
          </div>
        </div>

        {node.improvements.length > 0 && (
          <ul className="mt-3 space-y-1">
            {node.improvements.map((imp, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-forge-text-muted"
              >
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-forge-accent" />
                {imp}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isLast && (
        <div className="flex justify-center text-forge-text-muted/30">
          <ArrowDown className="h-5 w-5" />
        </div>
      )}
    </>
  );
}
