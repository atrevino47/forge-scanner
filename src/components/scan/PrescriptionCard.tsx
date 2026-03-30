'use client';

import type { Prescription } from '@/lib/prescriptions';
import { priceTierLabel, effortLabel } from '@/lib/prescriptions';

const STAGE_LABELS: Record<string, string> = {
  traffic: 'Traffic',
  landing: 'Landing',
  capture: 'Capture',
  offer: 'Offer',
  followup: 'Follow-up',
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  critical: { bg: 'bg-forge-accent/8', text: 'text-forge-accent', icon: 'report' },
  warning: { bg: 'bg-forge-warning/8', text: 'text-forge-warning', icon: 'warning' },
  opportunity: { bg: 'bg-forge-opportunity/8', text: 'text-forge-opportunity', icon: 'lightbulb' },
  positive: { bg: 'bg-forge-positive/8', text: 'text-forge-positive', icon: 'check_circle' },
};

interface PrescriptionCardProps {
  prescription: Prescription;
  index: number;
  onGetFixed: () => void;
}

export function PrescriptionCard({ prescription, index, onGetFixed }: PrescriptionCardProps) {
  const severity = SEVERITY_STYLES[prescription.severity] ?? SEVERITY_STYLES.warning;
  const isTopPriority = index === 0;

  return (
    <div
      data-rx="card"
      className={`bg-[#FEFEFE] rounded-xl overflow-hidden relative ${
        isTopPriority ? 'ring-1 ring-forge-accent/15 shadow-lg shadow-forge-accent/5' : 'shadow-sm'
      }`}
    >
      {/* Top priority badge */}
      {isTopPriority && (
        <div className="bg-forge-accent text-white px-4 py-1.5 flex items-center gap-2">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            priority_high
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Highest Impact Fix
          </span>
        </div>
      )}

      <div className="p-6 md:p-7">
        {/* Header: service name + badges */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${severity.bg} ${severity.text} px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest`}>
                {prescription.severity}
              </span>
              <span className="bg-forge-surface px-2 py-0.5 font-mono text-[9px] text-forge-text-secondary font-bold uppercase tracking-widest">
                {STAGE_LABELS[prescription.stage]}
              </span>
            </div>
            <h4 className="font-display text-xl md:text-2xl font-black tracking-tight text-forge-text leading-tight">
              {prescription.serviceName}
            </h4>
          </div>
          <span
            className={`material-symbols-outlined text-2xl shrink-0 ${severity.text}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {severity.icon}
          </span>
        </div>

        {/* Problem → Fix → Outcome flow */}
        <div className="space-y-4 mb-6">
          {/* What's broken */}
          <div className="flex gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-forge-critical/10 flex items-center justify-center mt-0.5">
              <span className="material-symbols-outlined text-forge-critical text-xs">close</span>
            </div>
            <div>
              <span className="font-mono text-[9px] text-forge-text-muted uppercase tracking-widest font-bold block mb-1">
                The Problem
              </span>
              <p className="text-sm text-forge-text leading-relaxed font-medium">{prescription.problem}</p>
              <p className="text-xs text-forge-text-secondary leading-relaxed mt-1">{prescription.whyItMatters}</p>
            </div>
          </div>

          {/* What Forge will do */}
          <div className="flex gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-forge-accent/10 flex items-center justify-center mt-0.5">
              <span
                className="material-symbols-outlined text-forge-accent text-xs"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                construction
              </span>
            </div>
            <div>
              <span className="font-mono text-[9px] text-forge-text-muted uppercase tracking-widest font-bold block mb-1">
                The Forge Fix
              </span>
              <p className="text-sm text-forge-text leading-relaxed font-medium">{prescription.forgeFix}</p>
            </div>
          </div>

          {/* Expected outcome */}
          <div className="flex gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-forge-positive/10 flex items-center justify-center mt-0.5">
              <span
                className="material-symbols-outlined text-forge-positive text-xs"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trending_up
              </span>
            </div>
            <div>
              <span className="font-mono text-[9px] text-forge-text-muted uppercase tracking-widest font-bold block mb-1">
                Expected Outcome
              </span>
              <p className="text-sm text-forge-positive leading-relaxed font-bold">{prescription.expectedOutcome}</p>
            </div>
          </div>
        </div>

        {/* Footer: effort + tier + CTA */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-forge-card">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-forge-text-secondary uppercase tracking-widest font-bold">
              {effortLabel(prescription.effort)}
            </span>
            <span className="w-1 h-1 rounded-full bg-forge-text-muted" />
            <span className="font-mono text-[9px] text-forge-accent uppercase tracking-widest font-bold">
              {priceTierLabel(prescription.priceTier)}
            </span>
          </div>
          <button
            onClick={onGetFixed}
            className="shrink-0 px-4 py-2 bg-forge-accent text-white font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-forge-accent-hover transition-colors active:scale-[0.98] shadow-sm shadow-forge-accent/20"
          >
            Get This Fixed
          </button>
        </div>
      </div>
    </div>
  );
}
