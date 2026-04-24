'use client';

import { useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type {
  BlueprintData,
  BlueprintDiagram,
  FunnelMapNode,
} from '../../../contracts/types';
import { fadeSlideUp, scaleIn } from '@/lib/gsap-presets';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  Check,
  X,
} from 'lucide-react';
import { FunnelDiagram } from './FunnelDiagram.client';

interface BlueprintViewProps {
  blueprint: BlueprintData;
}

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
  const { funnelMap, diagram } = blueprint;

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
      tl.fromTo('[data-bp="heading"]', heading.from, heading.vars, 0);

      const body = fadeSlideUp({ stagger: 0.12 });
      tl.fromTo('[data-bp="section"]', body.from, body.vars, 0.15);

      const cta = scaleIn();
      tl.fromTo('[data-bp="cta"]', cta.from, cta.vars, 0.8);
    },
    { scope: containerRef },
  );

  if (diagram) {
    return (
      <div ref={containerRef} className="py-12">
        <DiagramHeader diagram={diagram} biggestGap={funnelMap.biggestGap} />
        <GrandSlamChecklist diagram={diagram} />
        <div data-bp="section" className="mx-auto mb-10 w-full max-w-[1080px] px-4">
          <FunnelDiagram diagram={diagram} />
        </div>
        <OutcomeGuaranteeCard diagram={diagram} />
        <ObjectionFaqList diagram={diagram} />
        <PrimaryCta diagram={diagram} />
      </div>
    );
  }

  // Fallback: blueprint-diagram.ts hasn't populated yet (Minion 2 not shipped
  // or diagram generation failed). Render legacy funnel-map accordion.
  return (
    <div ref={containerRef} className="py-12">
      <h2
        data-bp="heading"
        className="font-display mb-8 text-center tracking-display leading-display"
        style={{ fontSize: 'clamp(1.8rem, 3vw + 0.5rem, 2.5rem)' }}
      >
        Your Optimized Funnel Blueprint
      </h2>
      <LegacyFunnelMap nodes={funnelMap.nodes} />
      <div
        data-bp="section"
        className="glass-card mx-auto mb-10 max-w-[960px] rounded-xl p-6 text-center"
      >
        <p className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-forge-accent">
          Revenue Impact Estimate
        </p>
        <p className="font-body text-base leading-relaxed text-forge-text">
          {funnelMap.revenueImpactEstimate}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DIAGRAM-MODE SECTIONS
// ─────────────────────────────────────────────────────────────

function DiagramHeader({
  diagram,
  biggestGap,
}: {
  diagram: BlueprintDiagram;
  biggestGap: string;
}) {
  const weakest = diagram.weakest_stage ?? biggestGap ?? 'your weakest stage';
  return (
    <div
      data-bp="heading"
      className="mx-auto mb-8 max-w-[1080px] px-4 text-center md:text-left"
    >
      <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-forge-accent">
        Blueprint · the rebuild
      </div>
      <h2
        className="font-display font-extrabold leading-[1.05] tracking-[-0.025em]"
        style={{ fontSize: 'clamp(1.9rem, 3.5vw + 0.5rem, 3rem)' }}
      >
        Your weakest stage was the{' '}
        <span className="text-forge-accent">{weakest}</span>.<br />
        Here&apos;s the ideal funnel.
      </h2>
      <p className="mt-4 max-w-[680px] font-body text-base leading-relaxed text-forge-text-secondary md:mx-0">
        Constructed against Hormozi&apos;s 5-step Grand Slam checklist. Every
        stage tagged to the Value Equation lever it strengthens. Industry-fit
        to {diagram.industry || 'your business'}.
      </p>
    </div>
  );
}

function GrandSlamChecklist({ diagram }: { diagram: BlueprintDiagram }) {
  const items = diagram.grand_slam_checklist ?? [];
  const allPresent = items.every((i) => i.present_in_diagram);
  return (
    <section data-bp="section" className="mx-auto mb-8 w-full max-w-[1080px] px-4">
      <div className="rounded-xl border border-forge-border-strong bg-forge-surface p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-forge-text-secondary">
            Grand Slam construction · 5 steps
          </span>
          {allPresent && (
            <span className="font-mono text-[11px] text-forge-positive">
              ✓ ALL PRESENT
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {items.map((item, i) => (
            <div
              key={item.step_name}
              className="rounded-lg border border-forge-border bg-forge-base p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-[18px] w-[18px] items-center justify-center rounded-sm font-mono text-[11px]',
                    item.present_in_diagram
                      ? 'bg-forge-positive text-white'
                      : 'bg-forge-critical/30 text-forge-critical',
                  )}
                  aria-hidden="true"
                >
                  {item.present_in_diagram ? <Check size={12} /> : <X size={12} />}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-forge-text-secondary">
                  0{i + 1}
                </span>
              </div>
              <div className="font-body text-[13px] font-semibold text-forge-text">
                {item.step_name}
              </div>
              <div className="mt-1 font-body text-[11.5px] leading-[1.4] text-forge-text-secondary">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OutcomeGuaranteeCard({ diagram }: { diagram: BlueprintDiagram }) {
  const g = diagram.outcome_guarantee;
  if (!g?.statement) return null;
  return (
    <section data-bp="section" className="mx-auto mb-8 w-full max-w-[1080px] px-4">
      <div className="rounded-xl border-2 border-forge-accent bg-forge-base p-6 md:p-7">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forge-accent font-display text-xl font-black text-white"
          >
            ✓
          </div>
          <div>
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-forge-accent">
              Outcome-based guarantee
            </div>
            <p className="mt-2 font-display text-[18px] font-semibold leading-tight text-forge-text md:text-[22px]">
              {g.statement}
            </p>
            {g.binary_criterion && (
              <p className="mt-3 font-body text-[13px] leading-relaxed text-forge-text-secondary">
                Binary criterion: {g.binary_criterion}
                {g.judged_by ? `. Judged by ${g.judged_by}.` : '.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ObjectionFaqList({ diagram }: { diagram: BlueprintDiagram }) {
  const faqs = diagram.objection_faq ?? [];
  if (!faqs.length) return null;
  return (
    <section data-bp="section" className="mx-auto mb-10 w-full max-w-[900px] px-4">
      <div className="mb-5 text-center">
        <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-forge-accent">
          Objections we hear
        </div>
        <h3
          className="font-display font-extrabold tracking-[-0.02em]"
          style={{ fontSize: 'clamp(1.4rem, 2vw + 0.5rem, 1.875rem)' }}
        >
          The things people ask before booking.
        </h3>
      </div>
      <dl>
        {faqs.map((f, i) => (
          <div
            key={i}
            className={cn(
              'grid gap-4 py-5 md:grid-cols-[32px_1fr]',
              i < faqs.length - 1 && 'border-b border-forge-border-strong',
            )}
          >
            <span className="font-mono text-xs text-forge-accent">
              0{i + 1}
            </span>
            <div>
              <dt className="font-display text-[17px] font-semibold text-forge-text">
                {f.q}
              </dt>
              <dd className="mt-1.5 font-body text-sm leading-relaxed text-forge-text-secondary">
                {f.a}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PrimaryCta({ diagram }: { diagram: BlueprintDiagram }) {
  const cta = diagram.primary_cta;
  if (!cta) return null;
  const hasUrl = cta.book_url && cta.book_url.length > 0;

  return (
    <section data-bp="cta" className="mx-auto w-full max-w-[900px] px-4">
      <div className="rounded-xl bg-forge-ink p-8 text-center text-forge-ink-text md:p-10">
        <h3
          className="font-display font-black leading-tight tracking-[-0.025em] text-white"
          style={{ fontSize: 'clamp(1.5rem, 2.4vw + 0.5rem, 2rem)' }}
        >
          {cta.headline || 'Want this built into your business?'}
        </h3>
        {cta.body && (
          <p className="mx-auto mt-3 max-w-[580px] font-body text-[15px] leading-relaxed text-forge-ink-text/80">
            {cta.body}
          </p>
        )}
        <div className="mt-6">
          {hasUrl ? (
            <a
              href={cta.book_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-forge-accent px-6 py-3 font-display text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-forge-accent-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-accent-bright focus-visible:ring-offset-2 focus-visible:ring-offset-forge-ink"
            >
              {cta.button_label} →
            </a>
          ) : (
            <div className="font-display text-[15px] font-semibold text-white">
              {cta.button_label}
            </div>
          )}
          <p className="mx-auto mt-4 max-w-[520px] font-body text-[13px] leading-relaxed text-forge-ink-text/70">
            {cta.button_subtext}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// LEGACY FUNNEL MAP FALLBACK (pre-diagram data)
// ─────────────────────────────────────────────────────────────

function LegacyFunnelMap({ nodes }: { nodes: FunnelMapNode[] }) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const toggleNode = useCallback((stage: string) => {
    setExpandedStage((prev) => (prev === stage ? null : stage));
  }, []);

  return (
    <div className="mx-auto mb-10 max-w-[960px] space-y-4 px-4">
      {nodes.map((node, i) => (
        <LegacyFunnelStageNode
          key={node.stage}
          node={node}
          isLast={i === nodes.length - 1}
          isExpanded={expandedStage === node.stage}
          onToggle={() => toggleNode(node.stage)}
        />
      ))}
    </div>
  );
}

function LegacyFunnelStageNode({
  node,
  isLast,
  isExpanded,
  onToggle,
}: {
  node: FunnelMapNode;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = HEALTH_ICON[node.health];
  const improvementsRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!improvementsRef.current) return;
      if (isExpanded) {
        gsap.set(improvementsRef.current, { display: 'block', overflow: 'hidden' });
        gsap.fromTo(
          improvementsRef.current,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' },
        );
      } else {
        gsap.to(improvementsRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            if (improvementsRef.current) {
              gsap.set(improvementsRef.current, { display: 'none' });
            }
          },
        });
      }
    },
    { dependencies: [isExpanded] },
  );

  return (
    <>
      <button
        type="button"
        data-bp="section"
        className={cn(
          'block w-full cursor-pointer rounded-xl border p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-accent focus-visible:ring-offset-2',
          isExpanded ? 'border-forge-accent bg-forge-accent/5' : HEALTH_BG[node.health],
        )}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="mb-3 flex items-center gap-3">
          <Icon className={cn('h-5 w-5', HEALTH_ICON_COLOR[node.health])} />
          <h3 className="font-display text-lg tracking-[-0.02em] text-forge-text">
            {node.label}
          </h3>
          {!node.exists && (
            <span className="rounded-full bg-forge-critical/10 px-2 py-0.5 text-[10px] font-medium uppercase text-forge-critical">
              Missing
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-forge-surface/50 p-3">
            <p className="mb-1 text-[10px] font-medium uppercase text-forge-text-muted">
              Current
            </p>
            <p className="font-body text-sm text-forge-text-muted">
              {node.currentDescription}
            </p>
          </div>
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
          <div ref={improvementsRef} style={{ display: 'none', height: 0 }}>
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
          </div>
        )}
      </button>
      {!isLast && (
        <div className="flex justify-center text-forge-text-muted/30" aria-hidden="true">
          <ArrowDown className="h-5 w-5" />
        </div>
      )}
    </>
  );
}
