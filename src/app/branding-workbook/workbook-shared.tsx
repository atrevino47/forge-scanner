'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { WorkbookType } from '@/../contracts/api';

/* ═══════════════════════════════════════════════════════
 * TYPES & CONSTANTS
 * ═══════════════════════════════════════════════════════ */

export const BRANDING_CONTENT_FIELDS = [
  'catalyst', 'coreTruth', 'proof',
  'originStory', 'failureStory', 'successStory', 'clientStory', 'industryStory',
  'idealClient', 'services', 'freeResources', 'voiceIdentity',
] as const;

export const OFFERS_CONTENT_FIELDS = [
  'crowdAvatar', 'crowdPain',
  'dreamOutcome', 'statusGain',
  'problemsDream', 'problemsLikelihood', 'problemsEffort', 'problemsTime',
  'solutionsList',
  'deliveryMechanism', 'productType',
  'trimHighCost', 'addLowCostHighValue', 'bundle',
  'scarcityUrgency', 'bonuses', 'guarantee', 'offerName', 'pricing',
] as const;

// Kept for backward compat — existing imports expect this name
export const CONTENT_FIELDS = BRANDING_CONTENT_FIELDS;

export type FieldId =
  | (typeof BRANDING_CONTENT_FIELDS)[number]
  | (typeof OFFERS_CONTENT_FIELDS)[number]
  | 'clientName'
  | 'businessName';

export const cx = {
  h3: 'font-display text-[18px] font-semibold text-forge-text mt-8 mb-2',
  body: 'font-body text-[15px] text-forge-text-secondary leading-relaxed mb-3',
  example: 'italic text-forge-text-secondary text-[14px] font-body leading-relaxed mb-4',
  questions: 'list-disc pl-6 space-y-1.5 font-body text-[15px] text-forge-text mb-1',
  story: 'mb-8',
} as const;

/* ═══════════════════════════════════════════════════════
 * HOOK — shared state + save logic
 * ═══════════════════════════════════════════════════════ */

export function useWorkbook(
  locale: string,
  userId?: string | null,
  options?: { type?: WorkbookType; contentFields?: readonly string[] },
) {
  const type: WorkbookType = options?.type ?? 'branding';
  const contentFields = options?.contentFields ?? BRANDING_CONTENT_FIELDS;

  const [fields, setFields] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loaded, setLoaded] = useState(false);
  const [serverId, setServerId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for 30s auto-save interval (avoids restarting interval on every keystroke)
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const serverIdRef = useRef(serverId);
  serverIdRef.current = serverId;
  const lastAutoSave = useRef('');
  const autoSaveInFlight = useRef(false);

  // Legacy key preserved for branding (don't wipe existing users' progress).
  // Offers uses a new namespaced key.
  const storageKey =
    type === 'branding'
      ? `forge-branding-workbook-${locale}`
      : `forge-${type}-workbook-${locale}`;

  /* ── Load from localStorage on mount ── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        if (parsed._serverId) setServerId(parsed._serverId);
        setFields(parsed);
      }
    } catch { /* start fresh */ }
    setLoaded(true);
  }, [storageKey]);

  /* ── Dark mode ── */
  useEffect(() => {
    if (localStorage.getItem('forge-workbook-dark') === 'true') setIsDark(true);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('forge-workbook-dark', String(next));
      return next;
    });
  }, []);

  /* ── Load from server when user logs in ── */
  useEffect(() => {
    if (!userId || !loaded) return;
    (async () => {
      try {
        const res = await fetch(`/api/workbook/mine?locale=${locale}&type=${type}`);
        if (!res.ok) return;
        const data = await res.json() as { id: string | null; answers: Record<string, string> | null };
        if (data.id && data.answers) {
          setServerId(data.id);
          const merged = { ...data.answers, _serverId: data.id };
          setFields(merged);
          try { localStorage.setItem(storageKey, JSON.stringify(merged)); } catch { /* full */ }
        }
      } catch { /* server unavailable — use localStorage */ }
    })();
  }, [userId, loaded, locale, type, storageKey]);

  /* ── Auto-save to localStorage (debounced 800ms) ── */
  useEffect(() => {
    if (!loaded || Object.keys(fields).length === 0) return;
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(fields)); } catch { /* full */ }
      setSaveStatus('saved');
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [fields, loaded, storageKey]);

  /* ── Auto-save to server every 30s ── */
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(async () => {
      const f = fieldsRef.current;
      const snapshot = JSON.stringify(f);
      if (snapshot === lastAutoSave.current) return; // no changes
      if (autoSaveInFlight.current) return;           // already saving
      if (Object.keys(f).length === 0) return;        // empty

      autoSaveInFlight.current = true;
      const completedCountNow = contentFields.filter((id) => (f[id] || '').trim().length > 0).length;
      try {
        const res = await fetch('/api/workbook/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: serverIdRef.current ?? undefined,
            type,
            clientName: f.clientName || undefined,
            businessName: f.businessName || undefined,
            locale,
            answers: f,
            completedCount: completedCountNow,
            totalFields: contentFields.length,
          }),
        });
        if (res.ok) {
          const data = await res.json() as { id: string };
          lastAutoSave.current = snapshot;
          if (!serverIdRef.current && data.id) {
            setServerId(data.id);
            try { localStorage.setItem(storageKey, JSON.stringify({ ...f, _serverId: data.id })); } catch { /* full */ }
          }
        }
      } catch { /* silent — next tick retries */ }
      autoSaveInFlight.current = false;
    }, 30_000);
    return () => clearInterval(interval);
  }, [loaded, locale, type, contentFields, storageKey]);

  const update = useCallback((id: FieldId, value: string) => {
    setFields((prev) => ({ ...prev, [id]: value }));
  }, []);

  const completedCount = contentFields.filter(
    (id) => (fields[id] || '').trim().length > 0
  ).length;
  const totalFields = contentFields.length;

  /* ── Manual save (button click) ── */
  const handleSave = async () => {
    try { localStorage.setItem(storageKey, JSON.stringify({ ...fields, _serverId: serverId })); } catch { /* full */ }
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/workbook/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: serverId ?? undefined,
          type,
          clientName: fields.clientName || undefined,
          businessName: fields.businessName || undefined,
          locale,
          answers: fields,
          completedCount,
          totalFields,
        }),
      });
      if (!res.ok) { setSaveStatus('error'); return; }
      const data = await res.json() as { id: string };
      lastAutoSave.current = JSON.stringify(fields); // mark as synced
      if (!serverId) {
        setServerId(data.id);
        try { localStorage.setItem(storageKey, JSON.stringify({ ...fields, _serverId: data.id })); } catch { /* full */ }
      }
      setSaveStatus('saved');
    } catch { setSaveStatus('error'); }
  };

  const handleExport = () => window.print();

  const handleReset = (confirmMsg: string) => {
    if (!window.confirm(confirmMsg)) return;
    setFields({});
    setServerId(null);
    localStorage.removeItem(storageKey);
    setSaveStatus('idle');
  };

  const v = (id: FieldId) => fields[id] || '';

  return { fields, loaded, saveStatus, completedCount, totalFields, update, handleSave, handleExport, handleReset, v, isDark, toggleDark };
}

/* ═══════════════════════════════════════════════════════
 * SHARED UI COMPONENTS
 * ═══════════════════════════════════════════════════════ */

export function AnswerArea({
  id, value, onChange, placeholder, rows = 5,
}: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="mt-4 mb-10">
      <textarea
        ref={ref} id={id} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Write your answer here...'}
        rows={rows}
        className="print:hidden w-full rounded-xl border border-forge-elevated bg-forge-card
          px-5 py-4 font-body text-[15px] leading-relaxed text-forge-text
          placeholder:text-forge-text-muted/60
          focus:border-forge-accent/30 focus:outline-none focus:ring-2 focus:ring-forge-accent/10
          resize-none transition-all duration-200"
      />
      <div className="hidden print:block whitespace-pre-wrap font-body text-[13px] leading-[1.7] text-forge-text min-h-[80px] border-b border-forge-border/40 pb-3 pt-1">
        {value || '\u00A0'}
      </div>
    </div>
  );
}

export function StepBadge({ n, label }: { n: number; label?: string }) {
  return (
    <span className="mb-3 inline-block rounded-md bg-forge-accent px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
      {label ?? 'Step'} {String(n).padStart(2, '0')}
    </span>
  );
}

export function Divider() {
  return <hr className="my-12 border-t border-forge-border/60 print:my-8" />;
}

export function WorkbookToolbar({
  completedCount, totalFields, saveStatus, onSave, onExport, onReset,
  isDark, onToggleDark,
  saveLabel, exportLabel, resetLabel, sectionsLabel,
}: {
  completedCount: number; totalFields?: number; saveStatus: string;
  onSave: () => void; onExport: () => void; onReset: () => void;
  isDark?: boolean; onToggleDark?: () => void;
  saveLabel?: string; exportLabel?: string; resetLabel?: string; sectionsLabel?: string;
}) {
  const total = totalFields ?? CONTENT_FIELDS.length;
  return (
    <div className="print:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-forge-border bg-forge-glass backdrop-blur-xl">
      <div className="mx-auto flex max-w-[740px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="relative h-9 w-9 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-forge-border" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeDasharray={`${(completedCount / total) * 94.25} 94.25`}
                strokeLinecap="round" className="text-forge-accent transition-all duration-500" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-forge-text">
              {completedCount}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="font-body text-[13px] text-forge-text-secondary">
              {completedCount} {sectionsLabel ?? `of ${total} sections`}
            </span>
            {saveStatus === 'saving' && <span className="ml-3 font-body text-[12px] text-forge-text-muted animate-pulse">Saving...</span>}
            {saveStatus === 'saved' && <span className="ml-3 font-body text-[12px] text-forge-positive">Saved</span>}
            {saveStatus === 'error' && <span className="ml-3 font-body text-[12px] text-forge-critical">Save failed</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleDark && (
            <button
              onClick={onToggleDark}
              className="rounded-lg px-2.5 py-2 text-forge-text-muted hover:bg-forge-card hover:text-forge-text transition-colors duration-150"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}
          <button onClick={onReset} className="rounded-lg px-3 py-2 font-body text-[13px] text-forge-text-muted hover:bg-forge-card hover:text-forge-text transition-colors duration-150">
            {resetLabel ?? 'Reset'}
          </button>
          <button onClick={onSave} className="rounded-lg border border-forge-border bg-forge-surface px-4 py-2 font-body text-[13px] font-medium text-forge-text hover:bg-forge-card transition-colors duration-150">
            {saveLabel ?? 'Save'}
          </button>
          <button onClick={onExport} className="rounded-lg bg-forge-accent px-4 py-2 font-body text-[13px] font-semibold text-white hover:bg-forge-accent-bright transition-colors duration-150">
            {exportLabel ?? 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WorkbookHeader({
  title, subtitle, v, update,
  namePlaceholder, businessPlaceholder,
}: {
  title: string; subtitle: string;
  v: (id: FieldId) => string; update: (id: FieldId, val: string) => void;
  namePlaceholder?: string; businessPlaceholder?: string;
}) {
  return (
    <header className="mb-14 text-center print:mb-10">
      <div className="mb-3 font-display text-[13px] font-bold uppercase tracking-[0.25em] text-forge-text-muted">
        forgewith.ai
      </div>
      <h1 className="font-display text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] text-forge-text sm:text-[44px]">
        {title}
      </h1>
      <p className="mt-3 font-body text-[17px] text-forge-text-secondary">{subtitle}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4 max-w-md mx-auto">
        <input type="text" value={v('clientName')} onChange={(e) => update('clientName', e.target.value)}
          placeholder={namePlaceholder ?? 'Your name'}
          className="print:hidden flex-1 rounded-lg border border-forge-elevated bg-forge-card px-4 py-2.5 text-center font-body text-[15px] text-forge-text placeholder:text-forge-text-muted/60 focus:border-forge-accent/30 focus:outline-none focus:ring-2 focus:ring-forge-accent/10 transition-all duration-200" />
        <input type="text" value={v('businessName')} onChange={(e) => update('businessName', e.target.value)}
          placeholder={businessPlaceholder ?? 'Your business'}
          className="print:hidden flex-1 rounded-lg border border-forge-elevated bg-forge-card px-4 py-2.5 text-center font-body text-[15px] text-forge-text placeholder:text-forge-text-muted/60 focus:border-forge-accent/30 focus:outline-none focus:ring-2 focus:ring-forge-accent/10 transition-all duration-200" />
      </div>
      {(v('clientName') || v('businessName')) && (
        <div className="hidden print:block mt-4 font-body text-[15px] text-forge-text-secondary">
          {[v('clientName'), v('businessName')].filter(Boolean).join(' — ')}
        </div>
      )}
    </header>
  );
}

export function WorkbookShell({ children, loaded, isDark }: { children: ReactNode; loaded: boolean; isDark?: boolean }) {
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forge-surface">
        <div className="text-forge-text-muted font-body text-sm tracking-wide">Loading...</div>
      </div>
    );
  }
  return (
    <div data-theme={isDark ? 'dark' : 'light'}>
      <style>{WORKBOOK_STYLES}</style>
      <div id="workbook-content" className="min-h-screen bg-forge-surface pb-28 print:pb-0 print:bg-white transition-colors duration-300">
        <div className="mx-auto max-w-[740px] px-6 pt-16 print:pt-8 print:px-0">
          {children}
          <footer className="hidden print:block text-center pt-8 mt-12 border-t border-forge-border/40">
            <p className="font-body text-[13px] text-forge-text-muted">forgewith.ai &mdash; AI-Powered Growth Partner</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
 * WORKBOOK STYLES (dark mode + print)
 * ═══════════════════════════════════════════════════════ */

/* Tailwind v4 @theme inline compiles classes to hardcoded values.
 * CSS variable overrides don't work. We must override the compiled
 * Tailwind class selectors directly using [data-theme="dark"]. */
const D = '[data-theme="dark"]';
const WORKBOOK_STYLES = `
/* ── Dark mode — Forge Brand v2 dark tokens ─────────────── */

/* Backgrounds */
${D} .bg-forge-surface { background-color: #1E1E1C !important; }
${D} .bg-forge-surface\\/40 { background-color: rgba(30,30,28,0.4) !important; }
${D} .bg-forge-surface\\/50 { background-color: rgba(30,30,28,0.5) !important; }
${D} .bg-forge-card { background-color: #282826 !important; }
${D} .bg-forge-glass { background-color: rgba(30,30,28,0.92) !important; }
${D} .bg-forge-positive\\/5 { background-color: rgba(92,184,122,0.05) !important; }
${D} .bg-forge-positive\\/20 { background-color: rgba(92,184,122,0.2) !important; }

/* Text */
${D} .text-forge-text { color: #F0EFE9 !important; }
${D} .text-forge-text-secondary { color: #B8B5AD !important; }
${D} .text-forge-text-muted { color: #9A9890 !important; }
${D} .text-forge-text-muted\\/60 { color: rgba(154,152,144,0.6) !important; }
${D} .text-forge-positive { color: #5CB87A !important; }
${D} .text-forge-critical { color: #FF6B6B !important; }
${D} .text-forge-border { color: rgba(255,107,43,0.12) !important; }

/* Borders */
${D} .border-forge-border { border-color: rgba(255,107,43,0.12) !important; }
${D} .border-forge-border\\/60 { border-color: rgba(255,107,43,0.07) !important; }
${D} .border-forge-border\\/40 { border-color: rgba(255,107,43,0.05) !important; }
${D} .border-forge-elevated { border-color: #353533 !important; }
${D} .border-forge-positive\\/20 { border-color: rgba(92,184,122,0.2) !important; }

/* Form elements (catch-all for inputs not covered above) */
${D} textarea::placeholder,
${D} input::placeholder { color: #9A9890 !important; }

/* Hover states */
${D} .hover\\:bg-forge-card:hover { background-color: #353533 !important; }
${D} .hover\\:text-forge-text:hover { color: #F0EFE9 !important; }

/* ── Print — always light ────────────────────────────────── */
@media print {
  body > div > header, [data-top-banner], [data-calcom-modal], nav {
    display: none !important;
  }
  body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 0.75in 0.85in; size: letter; }
  .step-section { page-break-before: always; }
  .step-section:first-of-type { page-break-before: avoid; }
  .step-section > div { page-break-inside: avoid; }
  h2 { font-size: 22px !important; }
  h3 { font-size: 15px !important; }
  /* Force light mode in print regardless of toggle */
  ${D} .bg-forge-surface { background-color: #F5F4F0 !important; }
  ${D} .bg-forge-card { background-color: #ECEAE4 !important; }
  ${D} .text-forge-text { color: #1A1917 !important; }
  ${D} .text-forge-text-secondary { color: #6B6860 !important; }
  ${D} .text-forge-text-muted { color: #B8B5AD !important; }
  ${D} .border-forge-border { border-color: #ECEAE4 !important; }
  ${D} .border-forge-elevated { border-color: #E2E0DA !important; }
}
`;
