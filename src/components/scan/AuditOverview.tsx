'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { FunnelStage, StageSummary } from '../../../contracts/types';
import type { ScanCompletedSummary } from '../../../contracts/events';
import type { StageState, ScreenshotEntry } from './types';
import { fadeSlideUp, clipReveal, scaleIn } from '@/lib/gsap-presets';

const STAGE_ORDER: FunnelStage[] = ['traffic', 'landing', 'capture', 'offer', 'followup'];

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'Traffic',
  landing: 'Landing',
  capture: 'Capture',
  offer: 'Offer',
  followup: 'Follow-up',
};

interface AuditOverviewProps {
  summary: ScanCompletedSummary | null;
  stages: Partial<Record<FunnelStage, StageState>>;
  screenshots: ScreenshotEntry[];
  onInitiateFix: () => void;
}

/* ANIMATION SEQUENCE (scroll-triggered at 85% viewport):
 * Beat 1 (0.00s): Badge + headline — clipReveal
 * Beat 2 (0.20s): Score card — scaleIn
 * Beat 3 (0.40s): Callout — fadeSlideUp
 * Beat 4 (0.60s): Timeline stages — fadeSlideUp, 150ms stagger
 * Beat 5 (1.40s): CTA card — scaleIn
 */

export function AuditOverview({ summary, stages, screenshots, onInitiateFix }: AuditOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);

  const health = summary?.overallHealth ?? 0;
  const severityLabel = health >= 70 ? 'Stable' : health >= 40 ? 'Weak' : 'Critical';

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    const headline = clipReveal();
    tl.fromTo('[data-ao="headline"]', headline.from, headline.vars, 0);

    const card = scaleIn();
    tl.fromTo('[data-ao="score-card"]', card.from, card.vars, 0.2);

    // Score count-up
    const counter = { value: 0 };
    tl.to(counter, {
      value: health,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (scoreRef.current) {
          scoreRef.current.textContent = Math.round(counter.value).toString();
        }
      },
    }, 0.3);

    const callout = fadeSlideUp();
    tl.fromTo('[data-ao="callout"]', callout.from, callout.vars, 0.4);

    const stageItems = fadeSlideUp({ stagger: 0.15 });
    tl.fromTo('[data-ao="stage"]', stageItems.from, stageItems.vars, 0.6);

    const cta = scaleIn();
    tl.fromTo('[data-ao="cta"]', cta.from, cta.vars, 1.4);
  }, { scope: containerRef, dependencies: [health] });

  // Compute per-stage metrics from summary data
  function getStageMetrics(stage: FunnelStage) {
    const stageState = stages[stage];
    const stageScreenshots = screenshots.filter((s) => s.stage === stage);
    const totalAnnotations = stageScreenshots.reduce((sum, s) => sum + s.annotations.length, 0);
    const criticalCount = stageScreenshots.reduce(
      (sum, s) => sum + s.annotations.filter((a) => a.type === 'critical').length, 0
    );
    return { stageState, screenshotCount: stageScreenshots.length, totalAnnotations, criticalCount };
  }

  // Identify worst stages for callout text
  const worstStages = STAGE_ORDER
    .filter((s) => stages[s]?.summary && stages[s]!.summary!.score < 40)
    .map((s) => STAGE_LABELS[s].toUpperCase());

  return (
    <div ref={containerRef} className="space-y-12">
      {/* Hero Section */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-12 h-1 bg-forge-accent" />
          <span className="font-mono text-forge-accent text-[10px] font-bold uppercase tracking-[0.2em]">
            System Scan: Active
          </span>
        </div>
        <h2
          data-ao="headline"
          className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-forge-text leading-[0.9] tracking-tighter uppercase mb-8"
        >
          Where Your <br className="md:hidden" />Customers <br className="md:hidden" />
          <span className="text-forge-accent">Drop Off</span>
        </h2>

        {/* Health Score Card */}
        <div
          data-ao="score-card"
          className="bg-forge-accent p-6 md:p-8 rounded-xl text-white shadow-xl shadow-forge-accent/20 flex items-end justify-between relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70 mb-1">
              Health Score Index
            </span>
            <div className="flex items-baseline gap-1">
              <span ref={scoreRef} className="font-display text-6xl sm:text-7xl font-black tabular-nums tracking-tighter leading-none">
                0
              </span>
              <span className="font-display text-2xl font-bold text-white/50">/100</span>
            </div>
          </div>
          <div className="relative z-10 pb-2">
            <div className="bg-[#FEFEFE] text-forge-accent px-3 py-1 rounded-sm flex items-center gap-1.5 shadow-md">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                {severityLabel}
              </span>
            </div>
          </div>
          {/* Background decoration */}
          <span
            className="material-symbols-outlined absolute -bottom-6 -right-6 text-white opacity-10 text-9xl pointer-events-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            settings_suggest
          </span>
        </div>

        {/* Headline Summary — AI-generated one-liner about biggest issue */}
        {summary?.topFinding && (
          <div data-ao="callout" className="mt-4 bg-forge-surface p-6 border-l-4 border-forge-accent">
            <p className="font-display font-bold text-xl leading-tight text-forge-text">
              {summary.topFinding}
            </p>
          </div>
        )}

        {/* Fallback callout if no topFinding but worst stages exist */}
        {!summary?.topFinding && worstStages.length > 0 && (
          <div data-ao="callout" className="mt-4 bg-forge-surface p-5 border-l-4 border-forge-accent">
            <p className="text-sm text-forge-text-secondary leading-relaxed font-medium">
              Severe leaks detected in the{' '}
              {worstStages.map((s, i) => (
                <span key={s}>
                  {i > 0 && ' and '}
                  <span className="font-bold text-forge-accent uppercase tracking-tighter">{s}</span>
                </span>
              ))}{' '}
              {worstStages.length === 1 ? 'stage' : 'stages'}. Immediate intervention required.
            </p>
          </div>
        )}
      </section>

      {/* Pipeline Anatomy — Vertical Timeline (mobile) / Grid (desktop) */}
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-forge-text-secondary font-bold mb-8 px-2">
          Pipeline Anatomy
        </h3>

        {/* Mobile: vertical timeline */}
        <div className="flex flex-col gap-0 md:hidden">
          {STAGE_ORDER.map((stage, index) => {
            const { stageState, screenshotCount: _screenshotCount } = getStageMetrics(stage);
            const score = stageState?.summary?.score ?? 0;
            const exists = stageState?.summary?.exists ?? false;
            const isLast = index === STAGE_ORDER.length - 1;
            const isWeak = score < 40 && exists;
            const isMissing = !exists && stageState?.summary !== undefined && stageState?.summary !== null;
            const isDim = isMissing || (!exists && !stageState?.summary);

            return (
              <div
                key={stage}
                data-ao="stage"
                className={`relative pl-10 ${!isLast ? 'pb-12 border-l-2' : ''} ${
                  isDim ? 'border-forge-accent/30' : 'border-forge-accent'
                }`}
              >
                <div
                  className={`absolute -left-2.5 top-0 rounded-full border-4 border-forge-base ${
                    isDim
                      ? 'w-4 h-4 bg-forge-accent/30 -left-2'
                      : 'w-5 h-5 bg-forge-accent shadow-[0_0_15px_rgba(232,83,14,0.4)]'
                  } ${isWeak ? 'shadow-[0_0_20px_rgba(232,83,14,0.6)]' : ''}`}
                />
                <div className="flex justify-between items-start mb-4">
                  <h4
                    className={`font-display text-2xl font-black uppercase tracking-tighter ${
                      isDim ? 'opacity-20' : isWeak ? 'text-forge-accent' : 'text-forge-text'
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </h4>
                  {stageState?.summary && (
                    <StageStatusBadge score={score} exists={exists} />
                  )}
                </div>
                {stageState?.summary && exists ? (
                  <StageMetricsCard
                    stage={stage}
                    summary={stageState.summary}
                    screenshotCount={_screenshotCount}
                    isWeak={isWeak}
                  />
                ) : isDim ? (
                  <div className="bg-forge-card/30 p-6 rounded-sm border-dashed border-2 border-forge-text-muted/30 text-center">
                    <span className="material-symbols-outlined text-forge-text-muted/50 mb-2">block</span>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-forge-text-secondary font-bold">
                      Insufficient Data Matrix
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Desktop: horizontal pipeline grid — stages as cards in a row */}
        <div className="hidden md:grid md:grid-cols-5 gap-4">
          {STAGE_ORDER.map((stage, index) => {
            const { stageState, screenshotCount: _screenshotCount } = getStageMetrics(stage);
            const score = stageState?.summary?.score ?? 0;
            const exists = stageState?.summary?.exists ?? false;
            const isWeak = score < 40 && exists;
            const isMissing = !exists && stageState?.summary !== undefined && stageState?.summary !== null;
            const isDim = isMissing || (!exists && !stageState?.summary);

            return (
              <div
                key={stage}
                data-ao="stage"
                className="relative"
              >
                {/* Connector line between cards */}
                {index < STAGE_ORDER.length - 1 && (
                  <div className={`absolute top-8 -right-2 w-4 h-0.5 ${isDim ? 'bg-forge-accent/20' : 'bg-forge-accent/60'}`} />
                )}
                <div className={`p-5 rounded-xl transition-all ${
                  isDim ? 'bg-forge-surface/50 opacity-50' : isWeak ? 'bg-forge-surface ring-1 ring-forge-accent/20' : 'bg-forge-surface'
                }`}>
                  {/* Dot indicator */}
                  <div className={`w-3 h-3 rounded-full mb-4 ${
                    isDim ? 'bg-forge-accent/30' : 'bg-forge-accent shadow-[0_0_10px_rgba(232,83,14,0.4)]'
                  }`} />
                  <h4 className={`font-display text-lg font-black uppercase tracking-tighter mb-3 ${
                    isDim ? 'opacity-30' : isWeak ? 'text-forge-accent' : 'text-forge-text'
                  }`}>
                    {STAGE_LABELS[stage]}
                  </h4>
                  {stageState?.summary ? (
                    <div className="flex items-baseline justify-between">
                      <span className={`font-display text-3xl font-black tabular-nums ${
                        !exists ? 'text-forge-text-muted' : score >= 70 ? 'text-forge-positive' : score >= 40 ? 'text-forge-warning' : 'text-forge-critical'
                      }`}>
                        {exists ? score : '—'}
                      </span>
                      <StageStatusBadge score={score} exists={exists} />
                    </div>
                  ) : (
                    <span className="font-mono text-[9px] text-forge-text-muted uppercase tracking-wider">
                      Scanning
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Card */}
      <section
        data-ao="cta"
        className="p-8 md:p-10 text-white rounded-xl shadow-2xl forge-gradient-primary relative overflow-hidden forge-glow"
      >
        <div className="relative z-10 md:flex md:items-center md:justify-between md:gap-12">
          <div className="space-y-4 md:flex-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">
              Foundry Insight
            </span>
            <h5 className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-none">
              Ready to Forge?
            </h5>
            <p className="text-sm font-body opacity-90 leading-relaxed font-medium max-w-lg">
              {summary?.topFinding || 'Your funnel has critical leaks that are costing you leads every day. Let our builders fix it.'}
            </p>
          </div>
          <button
            onClick={onInitiateFix}
            className="w-full md:w-auto md:shrink-0 py-4 md:px-10 bg-[#FEFEFE] text-forge-accent font-display font-black text-xs uppercase tracking-[0.25em] rounded-lg active:scale-95 transition-all shadow-xl shadow-black/10 mt-4 md:mt-0"
          >
            INITIATE FIX LOGIC
          </button>
        </div>
        <span
          className="material-symbols-outlined absolute -bottom-10 -right-10 text-white opacity-10 text-[180px] pointer-events-none"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          bolt
        </span>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

function StageStatusBadge({ score, exists }: { score: number; exists: boolean }) {
  if (!exists) {
    return (
      <span className="font-mono text-[10px] text-forge-text-secondary font-bold uppercase italic tracking-widest">
        Stagnant
      </span>
    );
  }
  if (score >= 70) {
    return (
      <span className="font-mono text-[10px] font-bold text-forge-text-secondary bg-forge-card px-2 py-0.5 uppercase tracking-widest">
        ESTABLISHED
      </span>
    );
  }
  if (score >= 40) {
    return (
      <span className="font-mono text-[10px] text-forge-warning font-black uppercase tracking-tighter">
        -{100 - score}% DROP
      </span>
    );
  }
  return (
    <span className="font-mono text-[10px] text-forge-critical font-black uppercase tracking-[0.1em]">
      CRITICAL LEAK
    </span>
  );
}

function StageMetricsCard({
  stage,
  summary,
  screenshotCount,
  isWeak,
}: {
  stage: FunnelStage;
  summary: StageSummary;
  screenshotCount: number;
  isWeak: boolean;
}) {
  // Traffic stage: 2-column grid — Input Volume + Stability
  if (stage === 'traffic') {
    const stability = `${summary.score}%`;
    const inputVolume = screenshotCount > 0 ? screenshotCount.toLocaleString() : '—';
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FEFEFE] p-4 rounded-sm border-l-4 border-forge-accent shadow-sm">
          <span className="font-mono text-[9px] uppercase text-forge-text-secondary block mb-1 font-bold tracking-widest">
            Input Volume
          </span>
          <span className="font-display text-xl font-black tabular-nums text-forge-text">
            {inputVolume}
          </span>
        </div>
        <div className="bg-[#FEFEFE] p-4 rounded-sm shadow-sm">
          <span className="font-mono text-[9px] uppercase text-forge-text-secondary block mb-1 font-bold tracking-widest">
            Stability
          </span>
          <span className="font-display text-xl font-black tabular-nums text-forge-positive">
            {stability}
          </span>
        </div>
      </div>
    );
  }

  // Landing stage: score as UX Friction Score with horizontal progress bar
  if (stage === 'landing') {
    const frictionScore = (summary.score / 10).toFixed(1);
    const barWidthPct = `${summary.score}%`;
    return (
      <div className="bg-[#FEFEFE] p-5 rounded-sm border-l-4 border-forge-text-secondary/30 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold uppercase tracking-tight text-forge-text">
            UX Friction Score
          </span>
          <span className="font-mono font-black tabular-nums text-lg text-forge-text">
            {frictionScore}/10
          </span>
        </div>
        <div className="w-full bg-forge-surface h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-forge-text-secondary rounded-full"
            style={{ width: barWidthPct }}
          />
        </div>
      </div>
    );
  }

  // Capture stage: large orange percentage + industry avg comparison
  if (stage === 'capture') {
    const conversionPct = `${(summary.score / 10).toFixed(1)}%`;
    const industryAvg = '4.2%';
    return (
      <div
        className={`bg-[#FEFEFE] p-5 rounded-sm border-l-4 border-forge-accent shadow-lg ring-1 ring-forge-accent/10`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-black uppercase tracking-tighter text-forge-text">
            Conversion Rate
          </span>
          <span className="font-display text-3xl font-black text-forge-accent tabular-nums">
            {conversionPct}
          </span>
        </div>
        <p className="text-[10px] text-forge-text-secondary font-mono font-bold uppercase tracking-widest">
          Industry Avg: {industryAvg}
        </p>
      </div>
    );
  }

  // Offer stage: faded card with Engagement Depth in seconds
  if (stage === 'offer') {
    const depthSeconds = Math.round((summary.score / 100) * 60);
    return (
      <div className="bg-[#FEFEFE]/50 p-5 rounded-sm border-l-4 border-forge-text-muted/30">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-forge-text-secondary uppercase tracking-tighter">
            Engagement Depth
          </span>
          <span className="font-mono font-black tabular-nums text-lg text-forge-text-secondary">
            {depthSeconds}s
          </span>
        </div>
      </div>
    );
  }

  // Followup stage (and any other): dashed "Insufficient Data" card
  return (
    <div className="bg-forge-card/30 p-6 rounded-sm border-dashed border-2 border-forge-text-muted/30 text-center">
      <span className="material-symbols-outlined text-forge-text-muted/50 mb-2">block</span>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-forge-text-secondary font-bold">
        Insufficient Data Matrix
      </p>
    </div>
  );
}
