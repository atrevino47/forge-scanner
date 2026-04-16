'use client';

import type { ScanCompletedSummary } from '../../../../contracts/events';

interface Props {
  summary: ScanCompletedSummary | null;
  websiteUrl: string;
}

export function Beat1BigIdea({ summary, websiteUrl }: Props) {
  if (!summary) return null;
  let host = websiteUrl;
  try {
    host = new URL(websiteUrl).host;
  } catch {}
  return (
    <section className="px-6 py-20 md:py-28 max-w-3xl mx-auto">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-forge-text-muted mb-4">
        The big idea — {host}
      </p>
      <h2 className="font-display text-3xl md:text-5xl text-forge-text leading-tight">
        {summary.topFinding ||
          `Your funnel has ${summary.criticalIssues} critical gap${summary.criticalIssues === 1 ? '' : 's'}.`}
      </h2>
    </section>
  );
}
