'use client';

import { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { FunnelStage, StageFinding } from '../../../contracts/types';
import type { StageState } from './types';
import { clipReveal, fadeSlideUp, scaleIn } from '@/lib/gsap-presets';

interface GeoAeoSectionProps {
  stages: Partial<Record<FunnelStage, StageState>>;
  onBookCall: () => void;
}

interface AnalysisModule {
  id: 'geo' | 'aeo';
  label: string;
  fullName: string;
  description: string;
  icon: string;
  score: number;
  findings: StageFinding[];
}

/**
 * Extract GEO/AEO findings from traffic stage findings by ID prefix.
 * The orchestrator merges these during analysis with geo-* and aeo-* prefixed IDs.
 */
function extractGeoAeoFindings(
  stages: Partial<Record<FunnelStage, StageState>>,
): { geoFindings: StageFinding[]; aeoFindings: StageFinding[] } {
  const allFindings: StageFinding[] = [];

  // Collect findings from all stages (primarily traffic, but check all)
  for (const stageState of Object.values(stages)) {
    if (stageState?.summary?.findings) {
      allFindings.push(...stageState.summary.findings);
    }
  }

  return {
    geoFindings: allFindings.filter((f) => f.id.startsWith('geo-')),
    aeoFindings: allFindings.filter((f) => f.id.startsWith('aeo-')),
  };
}

/**
 * Calculate a score from findings — mirrors the analyzer scoring logic.
 */
function scoreFromFindings(findings: StageFinding[]): number {
  if (findings.length === 0) return 0;

  let positive = 0;
  let total = findings.length;

  for (const f of findings) {
    if (f.type === 'positive') positive++;
  }

  return total > 0 ? Math.round((positive / total) * 100) : 0;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  critical: { bg: 'bg-forge-accent/8', text: 'text-forge-accent', icon: 'report' },
  warning: { bg: 'bg-forge-warning/8', text: 'text-forge-warning', icon: 'warning' },
  opportunity: { bg: 'bg-forge-opportunity/8', text: 'text-forge-opportunity', icon: 'lightbulb' },
  positive: { bg: 'bg-forge-positive/8', text: 'text-forge-positive', icon: 'check_circle' },
};

/* ANIMATION SEQUENCE (scroll-triggered at 85% viewport):
 * Beat 1 (0.00s): Badge + headline — clipReveal
 * Beat 2 (0.30s): Module cards — scaleIn, 200ms stagger
 * Beat 3 (0.70s): Finding items — fadeSlideUp, 100ms stagger
 */

export function GeoAeoSection({ stages, onBookCall }: GeoAeoSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { geoFindings, aeoFindings } = useMemo(() => extractGeoAeoFindings(stages), [stages]);

  // Don't render if no GEO/AEO data available
  if (geoFindings.length === 0 && aeoFindings.length === 0) return null;

  const modules: AnalysisModule[] = [];

  if (geoFindings.length > 0) {
    modules.push({
      id: 'geo',
      label: 'GEO',
      fullName: 'Generative Engine Optimization',
      description: 'How well AI systems (ChatGPT, Perplexity, Google AI) can consume and recommend your content.',
      icon: 'smart_toy',
      score: scoreFromFindings(geoFindings),
      findings: geoFindings,
    });
  }

  if (aeoFindings.length > 0) {
    modules.push({
      id: 'aeo',
      label: 'AEO',
      fullName: 'Answer Engine Optimization',
      description: 'How well your content targets featured snippets, voice search answers, and AI answer panels.',
      icon: 'record_voice_over',
      score: scoreFromFindings(aeoFindings),
      findings: aeoFindings,
    });
  }

  return <GeoAeoSectionInner containerRef={containerRef} modules={modules} onBookCall={onBookCall} />;
}

/**
 * Inner component to avoid hook rules with early return above.
 */
function GeoAeoSectionInner({
  containerRef,
  modules,
  onBookCall,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  modules: AnalysisModule[];
  onBookCall: () => void;
}) {
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });

    const headline = clipReveal();
    tl.fromTo('[data-ga="headline"]', headline.from, headline.vars, 0);

    const cards = scaleIn({ stagger: 0.2 });
    tl.fromTo('[data-ga="module"]', cards.from, cards.vars, 0.3);

    const items = fadeSlideUp({ stagger: 0.1 });
    tl.fromTo('[data-ga="finding"]', items.from, items.vars, 0.7);
  }, { scope: containerRef });

  const totalIssues = modules.reduce(
    (sum, m) => sum + m.findings.filter((f) => f.type !== 'positive').length,
    0,
  );

  return (
    <section ref={containerRef} className="space-y-8">
      {/* Section Header */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-12 h-1 bg-forge-opportunity" />
          <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-forge-opportunity uppercase">
            AI Discoverability
          </span>
        </div>
        <h2
          data-ga="headline"
          className="font-display text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-forge-text"
        >
          AI Search <br className="md:hidden" />
          <span className="text-forge-opportunity">Readiness</span>
        </h2>
        <p className="mt-4 text-forge-text-secondary leading-relaxed max-w-2xl">
          How visible is your business to AI-powered search engines? ChatGPT, Perplexity, Google AI Overview,
          and Apple Intelligence are the new front door — {totalIssues > 0
            ? <><span className="font-bold text-forge-opportunity">{totalIssues} issue{totalIssues !== 1 ? 's' : ''}</span> found.</>
            : 'your site is well optimized.'}
        </p>
      </header>

      {/* Module Score Cards */}
      <div className={`grid gap-4 ${modules.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {modules.map((mod) => {
          const scoreColor =
            mod.score >= 70 ? 'text-forge-positive' :
            mod.score >= 40 ? 'text-forge-warning' :
            'text-forge-critical';
          const issues = mod.findings.filter((f) => f.type !== 'positive').length;
          const passing = mod.findings.filter((f) => f.type === 'positive').length;

          return (
            <div
              key={mod.id}
              data-ga="module"
              className="bg-forge-surface rounded-xl p-6 md:p-7"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="material-symbols-outlined text-forge-opportunity text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {mod.icon}
                    </span>
                    <span className="font-display text-2xl font-black tracking-tight">{mod.label}</span>
                  </div>
                  <p className="font-mono text-[9px] text-forge-text-secondary uppercase tracking-widest font-bold">
                    {mod.fullName}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`font-display text-4xl font-black tabular-nums ${scoreColor}`}>
                    {mod.score}
                  </span>
                  <span className="font-display text-lg text-forge-text-muted">/100</span>
                </div>
              </div>

              <p className="text-sm text-forge-text-secondary leading-relaxed mb-5">
                {mod.description}
              </p>

              {/* Quick stats */}
              <div className="flex gap-3 mb-5">
                {issues > 0 && (
                  <span className="bg-forge-accent/8 text-forge-accent px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest rounded-sm">
                    {issues} Issue{issues !== 1 ? 's' : ''}
                  </span>
                )}
                {passing > 0 && (
                  <span className="bg-forge-positive/8 text-forge-positive px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-widest rounded-sm">
                    {passing} Passing
                  </span>
                )}
              </div>

              {/* Findings list */}
              <div className="space-y-3">
                {mod.findings.map((finding) => {
                  const sev = SEVERITY_STYLES[finding.type] ?? SEVERITY_STYLES.warning;
                  return (
                    <div
                      key={finding.id}
                      data-ga="finding"
                      className="flex gap-3 items-start"
                    >
                      <span
                        className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${sev.text}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {sev.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-forge-text leading-snug">{finding.title}</p>
                        <p className="text-xs text-forge-text-secondary leading-relaxed mt-0.5">{finding.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      {totalIssues > 0 && (
        <div className="bg-forge-surface rounded-xl p-6 md:p-8 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h3 className="font-display text-xl md:text-2xl font-black tracking-tight mb-1">
              Get Found by AI Search
            </h3>
            <p className="text-sm text-forge-text-secondary leading-relaxed max-w-lg">
              Most businesses aren&apos;t optimized for AI-powered search. Fix these {totalIssues} issues
              and your business will appear in AI-generated answers and recommendations.
            </p>
          </div>
          <button
            onClick={onBookCall}
            className="mt-4 md:mt-0 shrink-0 px-6 py-3 bg-forge-accent text-white font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-forge-accent-hover transition-colors active:scale-[0.98] shadow-sm shadow-forge-accent/20"
          >
            Get AI-Optimized
          </button>
        </div>
      )}
    </section>
  );
}
