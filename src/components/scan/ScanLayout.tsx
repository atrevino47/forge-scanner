'use client';

import { useReducer, useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type {
  FunnelStage,
  ScanStatus,
  StageStatus,
  FunnelStageResult,
  BlueprintData,
} from '../../../contracts/types';
import type { ScanSSEEvent, ScanCompletedSummary } from '../../../contracts/events';
import type { ScanResultsResponse } from '../../../contracts/api';
import type { ScreenshotEntry, StageState } from './types';
import { useCalcom } from '@/components/providers/CalcomContext';
import { useAuth } from '@/components/providers/SupabaseProvider';
import { ProgressIndicator } from './ProgressIndicator';
import { CapturePrompt } from './CapturePrompt';
import { SocialConfirmation } from './SocialConfirmation';
import { BlueprintCTA } from './BlueprintCTA';
import { BlueprintView } from './BlueprintView';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatToggle } from '@/components/chat/ChatToggle';
import { ResultsTopBar } from './ResultsTopBar';
import { ResultsBottomNav, type ResultsTab } from './ResultsBottomNav';
import { AuditOverview } from './AuditOverview';
import { StageFindingsView } from './StageFindingsView';
import { HealthPotential } from './HealthPotential';
import { ImplementationRoadmap } from './ImplementationRoadmap';
import { PrescriptionSection } from './PrescriptionSection';
import { GeoAeoSection } from './GeoAeoSection';

// ── Stage ordering ──────────────────────────────────────
const STAGE_ORDER: FunnelStage[] = [
  'traffic',
  'landing',
  'capture',
  'offer',
  'followup',
];

// ── State shape ─────────────────────────────────────────
interface ScanState {
  status: ScanStatus | 'connecting';
  websiteUrl: string;
  stages: Partial<Record<FunnelStage, StageState>>;
  screenshots: ScreenshotEntry[];
  showCapturePrompt: boolean;
  emailCaptured: boolean;
  leadId: string | null;
  capturedEmail: string | null;
  capturedPhone: string | null;
  socialAmbiguous: {
    platform: string;
    options: Array<{ handle: string; url: string }>;
  } | null;
  completedSummary: ScanCompletedSummary | null;
  blueprintAvailable: boolean;
  blueprintData: BlueprintData | null;
  error: string | null;
  progressMessages: string[];
}

type ScanAction =
  | { type: 'SSE_EVENT'; event: ScanSSEEvent }
  | { type: 'INITIAL_DATA'; data: ScanResultsResponse }
  | { type: 'EMAIL_CAPTURED'; leadId: string; email: string; phone?: string }
  | { type: 'DISMISS_CAPTURE' }
  | { type: 'SHOW_CAPTURE' }
  | { type: 'DISMISS_SOCIAL' }
  | { type: 'BLUEPRINT_GENERATED'; blueprint: BlueprintData }
  | { type: 'CONNECTION_ERROR'; error: string };

const initialState: ScanState = {
  status: 'connecting',
  websiteUrl: '',
  stages: {},
  screenshots: [],
  showCapturePrompt: false,
  emailCaptured: false,
  leadId: null,
  capturedEmail: null,
  capturedPhone: null,
  socialAmbiguous: null,
  completedSummary: null,
  blueprintAvailable: false,
  blueprintData: null,
  error: null,
  progressMessages: [],
};

// ── Helpers ─────────────────────────────────────────────
const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'traffic sources',
  landing: 'landing experience',
  capture: 'lead capture',
  offer: 'offer page',
  followup: 'follow-up system',
};

const SOURCE_LABELS: Record<string, string> = {
  website: 'website',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  gbp: 'Google Business Profile',
  ads: 'ad campaigns',
};

function computeSummary(stages: FunnelStageResult[]): ScanCompletedSummary {
  const withSummary = stages.filter((s) => s.summary);
  const avgHealth =
    withSummary.length > 0
      ? Math.round(
          withSummary.reduce((sum, s) => sum + (s.summary?.score ?? 0), 0) /
            withSummary.length,
        )
      : 0;

  return {
    overallHealth: avgHealth,
    stagesFound: stages.filter((s) => s.summary?.exists).length,
    stagesMissing: stages.filter((s) => s.summary && !s.summary.exists).length,
    criticalIssues: stages.reduce(
      (sum, s) =>
        sum + (s.summary?.findings.filter((f) => f.type === 'critical').length ?? 0),
      0,
    ),
    topFinding: withSummary[0]?.summary?.headline ?? '',
  };
}

// ── Reducer ─────────────────────────────────────────────
function handleSSEEvent(state: ScanState, event: ScanSSEEvent): ScanState {
  switch (event.type) {
    case 'scan_started':
      return {
        ...state,
        status: 'scanning',
        websiteUrl: event.url,
        progressMessages: [...state.progressMessages, 'Starting your funnel scan...'],
      };
    case 'page_discovered':
      return {
        ...state,
        stages: {
          ...state.stages,
          [event.stage]: state.stages[event.stage] ?? {
            status: 'pending' as StageStatus,
            summary: null,
          },
        },
        progressMessages: [
          ...state.progressMessages,
          `Discovering your ${STAGE_LABELS[event.stage]}...`,
        ],
      };
    case 'screenshot_captured': {
      if (state.screenshots.some((s) => s.id === event.screenshotId)) {
        return state;
      }
      return {
        ...state,
        screenshots: [
          ...state.screenshots,
          {
            id: event.screenshotId,
            stage: event.stage,
            source: event.source,
            thumbnailUrl: event.thumbnailUrl,
            viewport: event.viewport,
            annotations: [],
            isNew: true,
          },
        ],
        progressMessages: [
          ...state.progressMessages,
          `Capturing your ${SOURCE_LABELS[event.source] ?? event.source}...`,
        ],
      };
    }
    case 'social_detected':
      return {
        ...state,
        progressMessages: [
          ...state.progressMessages,
          `Found your ${event.platform} profile...`,
        ],
      };
    case 'social_ambiguous':
      return {
        ...state,
        socialAmbiguous: { platform: event.platform, options: event.options },
      };
    case 'capture_prompt':
      return { ...state, showCapturePrompt: !state.emailCaptured };
    case 'stage_analyzing':
      return {
        ...state,
        status: 'analyzing',
        stages: {
          ...state.stages,
          [event.stage]: { status: 'analyzing' as StageStatus, summary: null },
        },
        progressMessages: [
          ...state.progressMessages,
          `Analyzing your ${STAGE_LABELS[event.stage]}...`,
        ],
      };
    case 'annotation_ready':
      return {
        ...state,
        screenshots: state.screenshots.map((s) =>
          s.id === event.screenshotId
            ? { ...s, annotations: event.annotations, isNew: true }
            : s,
        ),
      };
    case 'stage_completed':
      return {
        ...state,
        stages: {
          ...state.stages,
          [event.stage]: { status: 'completed' as StageStatus, summary: event.summary },
        },
      };
    case 'stage_failed':
      return {
        ...state,
        stages: {
          ...state.stages,
          [event.stage]: { status: 'failed' as StageStatus, summary: null },
        },
      };
    case 'scan_completed':
      return {
        ...state,
        status: 'completed',
        completedSummary: event.summary,
        progressMessages: [...state.progressMessages, 'Scan complete!'],
      };
    case 'scan_failed':
      return { ...state, status: 'failed', error: event.error };
    case 'blueprint_available':
      return { ...state, blueprintAvailable: true };
    case 'video_analysis':
      return state;
    default:
      return state;
  }
}

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'SSE_EVENT':
      return handleSSEEvent(state, action.event);

    case 'INITIAL_DATA': {
      const { scan, lead, blueprintAvailable } = action.data;
      const screenshots: ScreenshotEntry[] = [];
      const stages: Partial<Record<FunnelStage, StageState>> = {};

      for (const sr of scan.stages) {
        stages[sr.stage] = { status: sr.status, summary: sr.summary };
        for (const ss of sr.screenshots) {
          screenshots.push({
            id: ss.id,
            stage: ss.stage,
            source: ss.sourceType,
            thumbnailUrl: ss.storageUrl,
            viewport: ss.viewport,
            annotations: ss.annotations,
            isNew: false,
          });
        }
      }

      return {
        ...state,
        status: scan.status,
        websiteUrl: scan.websiteUrl,
        leadId: lead.id,
        emailCaptured: !!lead.email,
        capturedEmail: lead.email,
        capturedPhone: lead.phone,
        stages,
        screenshots,
        blueprintAvailable,
        completedSummary:
          scan.status === 'completed' ? computeSummary(scan.stages) : null,
      };
    }

    case 'EMAIL_CAPTURED':
      return {
        ...state,
        emailCaptured: true,
        leadId: action.leadId,
        capturedEmail: action.email,
        capturedPhone: action.phone ?? null,
        showCapturePrompt: false,
      };

    case 'DISMISS_CAPTURE':
      return { ...state, showCapturePrompt: false };

    case 'SHOW_CAPTURE':
      return { ...state, showCapturePrompt: true };

    case 'DISMISS_SOCIAL':
      return { ...state, socialAmbiguous: null };

    case 'BLUEPRINT_GENERATED':
      return { ...state, blueprintData: action.blueprint };

    case 'CONNECTION_ERROR':
      return { ...state, error: action.error };

    default:
      return state;
  }
}

// ── Component ───────────────────────────────────────────
export function ScanLayout({ scanId }: { scanId: string }) {
  const [state, dispatch] = useReducer(scanReducer, initialState);
  const { hasBooked, openCalcom } = useCalcom();
  // Auth context — available for future use (e.g., SaveResultsPrompt)
  useAuth();

  // Chat state — controlled here so the 30s timer can auto-open
  const [chatOpen, setChatOpen] = useState(false);
  const chatTimerFiredRef = useRef(false);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<ResultsTab>('overview');
  const [activeStage, setActiveStage] = useState<FunnelStage>('landing');

  // Refs for GSAP blur/unblur animation (FIX-0020)
  const resultsRef = useRef<HTMLDivElement>(null);
  const gateOverlayRef = useRef<HTMLDivElement>(null);

  // ── Fetch initial scan data ──
  useEffect(() => {
    fetch(`/api/scan/results/${scanId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ScanResultsResponse | null) => {
        if (data) dispatch({ type: 'INITIAL_DATA', data });
      })
      .catch(() => {});
  }, [scanId]);

  // ── SSE connection for real-time updates ──
  useEffect(() => {
    const es = new EventSource(`/api/scan/status/${scanId}`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as ScanSSEEvent;
        dispatch({ type: 'SSE_EVENT', event });
      } catch {}
    };
    es.onerror = () => {};
    return () => es.close();
  }, [scanId]);

  // ── 30s auto-open chat after scan completes ──
  useEffect(() => {
    if (
      !state.completedSummary ||
      !state.emailCaptured ||
      hasBooked ||
      chatTimerFiredRef.current
    )
      return;

    const timer = setTimeout(() => {
      chatTimerFiredRef.current = true;
      setChatOpen(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [state.completedSummary, state.emailCaptured, hasBooked]);

  // ── Exit detection — trigger follow-up if user leaves without booking ──
  const exitTriggeredRef = useRef(false);

  useEffect(() => {
    if (!state.emailCaptured || !state.leadId || hasBooked) return;

    const triggerExit = (reason: 'exit_intent' | 'abandoned_scan') => {
      if (exitTriggeredRef.current || hasBooked) return;
      exitTriggeredRef.current = true;

      const payload = JSON.stringify({
        scanId,
        leadId: state.leadId,
        reason,
      });

      navigator.sendBeacon('/api/followup/trigger', new Blob([payload], { type: 'application/json' }));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.completedSummary) {
        triggerExit('exit_intent');
      }
    };

    const handleBeforeUnload = () => {
      if (state.completedSummary) {
        triggerExit('exit_intent');
      } else {
        triggerExit('abandoned_scan');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [scanId, state.emailCaptured, state.leadId, state.completedSummary, hasBooked]);

  // ── Pre-fill Cal.com from captured data ──
  const handleOpenCalcom = (source: string = 'results_cta') => {
    openCalcom({
      email: state.capturedEmail ?? undefined,
      phone: state.capturedPhone ?? undefined,
      source,
    });
  };

  const isScanning =
    state.status === 'scanning' ||
    state.status === 'capturing' ||
    state.status === 'analyzing' ||
    state.status === 'connecting';
  const isComplete = state.status === 'completed';
  const isFailed = state.status === 'failed';
  const needsEmailGate = isComplete && !state.emailCaptured;

  /* ANIMATION SEQUENCE — Email gate blur/unblur:
   * Gate on (needsEmailGate=true):
   *   Beat 1 (0.00s): Results — filter blur(0px)→blur(8px), 0.6s power2.out
   *   Beat 2 (0.20s): Overlay — fadeSlideUp (y 20→0, opacity 0→1), 0.5s power2.out
   * Gate off (emailCaptured=true):
   *   Beat 1 (0.00s): Overlay — fade out opacity→0, 0.3s power2.in
   *   Beat 2 (0.30s): Results — blur(8px)→blur(0px) + scale(0.98→1), 0.8s power2.inOut
   */
  useGSAP(
    () => {
      if (!resultsRef.current) return;

      if (needsEmailGate) {
        // Blur entrance
        gsap.to(resultsRef.current, {
          filter: 'blur(8px)',
          duration: 0.6,
          ease: 'power2.out',
        });
        // Overlay entrance
        if (gateOverlayRef.current) {
          gsap.fromTo(
            gateOverlayRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.2 },
          );
        }
      } else if (state.emailCaptured) {
        // Unblur reveal — overlay fades first, then blur removes
        const tl = gsap.timeline();
        if (gateOverlayRef.current) {
          tl.to(gateOverlayRef.current, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
          });
        }
        tl.to(
          resultsRef.current,
          {
            filter: 'blur(0px)',
            scale: 1,
            duration: 0.8,
            ease: 'power2.inOut',
          },
          0.3,
        );
      }
    },
    { dependencies: [needsEmailGate, state.emailCaptured] },
  );

  return (
    <div className="min-h-screen bg-forge-base">
      {/* Fixed top bar */}
      <ResultsTopBar
        onBookCall={() => handleOpenCalcom('banner_cta')}
        scannedUrl={state.websiteUrl}
        showUrl={isComplete}
      />

      <main className="pt-20 md:pt-24 pb-28 md:pb-12 px-4 sm:px-6 lg:px-8 w-full max-w-lg md:max-w-[1120px] mx-auto">
        {/* Progress indicator — visible while scanning */}
        {isScanning && <ProgressIndicator messages={state.progressMessages} />}

        {/* Error state */}
        {isFailed && (
          <div className="bg-forge-surface rounded-xl p-8 text-center">
            <h2 className="font-display mb-2 text-2xl tracking-display text-forge-text">
              Scan Failed
            </h2>
            <p className="text-forge-text-muted">
              {state.error || 'Something went wrong. Please try again.'}
            </p>
          </div>
        )}

        {/* Desktop inline tab navigation — hidden on mobile (bottom nav used instead) */}
        {isComplete && (
          <nav className="hidden md:flex items-center gap-1 mb-8 bg-forge-surface/60 backdrop-blur-sm p-1 rounded-lg w-fit">
            {(['overview', 'stages', 'roadmap'] as const).map((tab) => {
              const labels = { overview: 'Overview', stages: 'Stages', roadmap: 'Roadmap' };
              const icons = { overview: 'dashboard', stages: 'architecture', roadmap: 'analytics' };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-mono text-[11px] font-bold uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-forge-base text-forge-accent shadow-sm'
                      : 'text-forge-text-secondary hover:text-forge-text'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {icons[tab]}
                  </span>
                  {labels[tab]}
                </button>
              );
            })}
          </nav>
        )}

        {/* Results content (GSAP-driven blur when email gate is active) */}
        <div
          ref={resultsRef}
          className={needsEmailGate ? 'pointer-events-none select-none' : ''}
          style={needsEmailGate ? { filter: 'blur(8px)', scale: 0.98 } : {}}
        >
          {/* ── TAB CONTENT ── */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Desktop: two-column layout — audit left, sidebar right */}
              <div className="md:grid md:grid-cols-[1fr_380px] md:gap-10 md:items-start">
                {/* Left column — main audit content */}
                <div className="space-y-12">
                  <AuditOverview
                    summary={state.completedSummary}
                    stages={state.stages}
                    screenshots={state.screenshots}
                    onInitiateFix={() => handleOpenCalcom('results_cta')}
                  />
                </div>

                {/* Right column — sidebar: stage breakdown + health potential (desktop only, stacked below on mobile) */}
                <aside className="space-y-8 md:sticky md:top-28">
                  {/* Stage Summary Grid */}
                  {isComplete && STAGE_ORDER.some((s) => state.stages[s]) && (
                    <section className="bg-forge-surface p-5 rounded-xl">
                      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-forge-text-secondary mb-4">
                        Stage Breakdown
                      </h3>
                      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0 scrollbar-hide">
                        {STAGE_ORDER.map((stage) => {
                          const stageState = state.stages[stage];
                          if (!stageState) return null;
                          const score = stageState.summary?.score ?? 0;
                          const exists = stageState.summary?.exists ?? false;
                          const scoreColor = !exists
                            ? 'text-forge-text-muted'
                            : score >= 70
                              ? 'text-forge-positive'
                              : score >= 40
                                ? 'text-forge-warning'
                                : 'text-forge-critical';
                          return (
                            <button
                              key={stage}
                              onClick={() => {
                                setActiveTab('stages');
                                setActiveStage(stage);
                              }}
                              className="shrink-0 md:shrink md:w-full flex flex-col md:flex-row md:justify-between items-center md:items-center gap-1 md:gap-0 px-4 py-3 bg-forge-base border border-forge-card rounded-lg hover:bg-forge-card transition-all active:scale-[0.98]"
                            >
                              <span className="font-mono text-[9px] uppercase tracking-widest text-forge-text-secondary font-bold whitespace-nowrap">
                                {STAGE_LABELS[stage]}
                              </span>
                              {stageState.summary ? (
                                <span className={`font-display text-xl md:text-lg font-black tabular-nums ${scoreColor}`}>
                                  {exists ? score : '—'}
                                </span>
                              ) : (
                                <span className="font-mono text-[9px] text-forge-text-muted uppercase tracking-wider">
                                  Scanning
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Blueprint CTA — sidebar placement on desktop */}
                  {isComplete && state.emailCaptured && !state.blueprintData && (
                    <BlueprintCTA
                      scanId={scanId}
                      blueprintAvailable={state.blueprintAvailable}
                      onGenerated={(blueprint) =>
                        dispatch({ type: 'BLUEPRINT_GENERATED', blueprint })
                      }
                    />
                  )}
                </aside>
              </div>

              {state.completedSummary && (
                <HealthPotential
                  summary={state.completedSummary}
                  onInitiateOptimization={() => handleOpenCalcom('results_cta')}
                />
              )}

              {/* GEO/AEO — AI discoverability analysis (findings extracted from traffic stage) */}
              {isComplete && (
                <GeoAeoSection
                  stages={state.stages}
                  onBookCall={() => handleOpenCalcom('geo_aeo_cta')}
                />
              )}

              {/* Prescription offers — Hormozi-style prescriptive fixes based on findings */}
              {isComplete && (
                <PrescriptionSection
                  stages={state.stages}
                  onBookCall={() => handleOpenCalcom('prescription_cta')}
                />
              )}
            </div>
          )}

          {activeTab === 'stages' && (
            <div>
              {/* Stage selector pills */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-2 px-2 scrollbar-hide">
                {STAGE_ORDER.map((stage) => {
                  const hasData = state.stages[stage] || state.screenshots.some((s) => s.stage === stage);
                  if (!hasData) return null;
                  return (
                    <button
                      key={stage}
                      onClick={() => setActiveStage(stage)}
                      className={`shrink-0 px-4 py-2 rounded-sm font-mono text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] ${
                        activeStage === stage
                          ? 'bg-forge-accent text-white shadow-md'
                          : 'bg-forge-surface text-forge-text-secondary hover:bg-forge-card'
                      }`}
                    >
                      {STAGE_LABELS[stage]}
                    </button>
                  );
                })}
              </div>
              <StageFindingsView
                stage={activeStage}
                stageState={state.stages[activeStage]}
                screenshots={state.screenshots.filter((s) => s.stage === activeStage)}
                onInitiateFix={() => handleOpenCalcom('results_cta')}
              />
            </div>
          )}

          {activeTab === 'roadmap' && (
            <ImplementationRoadmap
              stages={state.stages}
              onForgeSolution={() => handleOpenCalcom('results_cta')}
            />
          )}

          {/* Blueprint view — after blueprint generated (overview tab, full width) */}
          {activeTab === 'overview' && state.blueprintData && (
            <BlueprintView blueprint={state.blueprintData} />
          )}
        </div>

        {/* Email gate overlay — GSAP animated entrance/exit */}
        {needsEmailGate && (
          <div
            ref={gateOverlayRef}
            className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-forge-base via-forge-base/95 to-transparent px-6 pb-28 pt-20"
            style={{ opacity: 0 }}
          >
            <div className="mx-auto max-w-md text-center">
              <h3 className="font-display mb-2 text-xl tracking-display">
                Unlock Your Full Results
              </h3>
              <p className="mb-4 text-sm text-forge-text-muted">
                Enter your email to see the complete audit findings.
              </p>
              <button
                onClick={() => dispatch({ type: 'SHOW_CAPTURE' })}
                className="rounded-lg bg-forge-accent px-6 py-3 font-body font-semibold text-white transition-colors duration-200 hover:bg-forge-accent-hover"
              >
                Unlock Results
              </button>
            </div>
          </div>
        )}

        {/* Capture prompt — slides in from bottom */}
        {state.showCapturePrompt && state.leadId && (
          <CapturePrompt
            scanId={scanId}
            leadId={state.leadId}
            onSubmit={(leadId, email, phone) =>
              dispatch({ type: 'EMAIL_CAPTURED', leadId, email, phone })
            }
            onDismiss={() => dispatch({ type: 'DISMISS_CAPTURE' })}
          />
        )}

        {/* Social confirmation popup */}
        {state.socialAmbiguous && (
          <SocialConfirmation
            platform={state.socialAmbiguous.platform}
            options={state.socialAmbiguous.options}
            scanId={scanId}
            leadId={state.leadId}
            onConfirm={() => dispatch({ type: 'DISMISS_SOCIAL' })}
            onDismiss={() => dispatch({ type: 'DISMISS_SOCIAL' })}
          />
        )}
      </main>

      {/* Bottom navigation — only show when scan is complete */}
      {isComplete && (
        <ResultsBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Chat toggle + container — only after email captured + leadId available */}
      {state.emailCaptured && state.leadId && (
        <>
          <ChatToggle
            isOpen={chatOpen}
            onClick={() => setChatOpen((prev) => !prev)}
            hasNewMessage={false}
          />
          <ChatContainer
            scanId={scanId}
            leadId={state.leadId}
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        </>
      )}
    </div>
  );
}
