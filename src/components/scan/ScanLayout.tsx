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
import {
  BlueprintDesktop,
  BlueprintMobile,
} from '@/components/blueprint-redesign';
import { ScanDesktop, type Milestone, type ScreenshotEntry as RedesignScreenshot } from '@/components/scan-redesign/ScanDesktop';
import { ScanMobile } from '@/components/scan-redesign/ScanMobile';
import { CaptureGate } from '@/components/scan-redesign/CaptureGate';
import { ResultsDesktop } from '@/components/scan-redesign/ResultsDesktop';
import { ResultsMobile } from '@/components/scan-redesign/ResultsMobile';
import type { StageScore } from '@/components/scan-redesign/results-data';
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

// ── State → redesign props mappers ──────────────────────
const MILESTONE_DETAILS: Record<FunnelStage | 'crawl', { id: string; t: string; detail: string }> = {
  crawl: { id: 'crawl', t: 'Crawling site', detail: 'Pages + screenshots at 3 breakpoints' },
  traffic: { id: 'traffic', t: 'Traffic sources', detail: 'Channel + analytics detection' },
  landing: { id: 'landing', t: 'Landing experience', detail: 'Vision pass · scoring elements' },
  capture: { id: 'capture', t: 'Lead capture', detail: 'Form fields, friction, speed-to-lead' },
  offer: { id: 'offer', t: 'Offer & conversion', detail: 'Value Equation cross-check' },
  followup: { id: 'followup', t: 'Follow-up system', detail: 'Email cadence, SMS, retargeting' },
};

const STAGE_LABEL_DISPLAY: Record<FunnelStage, string> = {
  traffic: 'Traffic sources',
  landing: 'Landing experience',
  capture: 'Lead capture',
  offer: 'Offer & conversion',
  followup: 'Follow-up system',
};

function stagesToMilestones(
  stages: Partial<Record<FunnelStage, StageState>>,
  hasAnyScreenshot: boolean,
): Milestone[] {
  const result: Milestone[] = [];
  // Crawl is always implied when any screenshot or stage has been touched
  result.push({
    ...MILESTONE_DETAILS.crawl,
    s: hasAnyScreenshot || Object.keys(stages).length > 0 ? 'done' : 'queued',
  });
  for (const stage of STAGE_ORDER) {
    const ss = stages[stage];
    let s: 'done' | 'active' | 'queued' = 'queued';
    if (ss?.status === 'completed') s = 'done';
    else if (ss?.status === 'analyzing') s = 'active';
    else if (ss?.status === 'failed') s = 'done'; // surface as done; failed icon comes from elsewhere
    result.push({ ...MILESTONE_DETAILS[stage], s });
  }
  return result;
}

function progressMessagesToActivityLog(
  messages: string[],
): Array<[string, string, string]> {
  // Synthesize timestamps in 4s increments. Mark latest as active, prior as done.
  const last = messages.length - 1;
  return messages.slice(-12).map((msg, i, arr) => {
    const idx = messages.length - arr.length + i;
    const totalSecs = idx * 4 + 2;
    const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const ss = String(totalSecs % 60).padStart(2, '0');
    const icon = idx === last ? '●' : '✓';
    return [`${mm}:${ss}`, icon, msg];
  });
}

function screenshotsToRedesignThumbnails(
  screenshots: ScreenshotEntry[],
): RedesignScreenshot[] {
  return screenshots.slice(0, 3).map((s, i) => ({
    id: s.id,
    url: s.thumbnailUrl,
    label: `${s.stage} · ${s.source}`,
    state: i === 0 ? 'CURRENT' : 'QUEUED',
  }));
}

function latestScreenshotToCurrent(
  screenshots: ScreenshotEntry[],
): RedesignScreenshot | undefined {
  if (screenshots.length === 0) return undefined;
  const latest = screenshots[screenshots.length - 1];
  const annotations = (latest.annotations ?? []).slice(0, 4).map((a) => {
    const sev =
      a.type === 'critical'
        ? 'critical'
        : a.type === 'warning'
        ? 'warning'
        : ('positive' as const);
    return {
      x: a.position?.x ?? 30,
      y: a.position?.y ?? 30,
      severity: sev as 'critical' | 'warning' | 'positive',
    };
  });
  return {
    id: latest.id,
    url: latest.thumbnailUrl,
    label: `${latest.stage} · ${latest.source}`,
    annotations,
  };
}

function stagesToScores(
  stages: Partial<Record<FunnelStage, StageState>>,
): StageScore[] {
  const scores: StageScore[] = [];
  let weakestKey: string | null = null;
  let weakestScore = 101;
  for (const stage of STAGE_ORDER) {
    const ss = stages[stage];
    const score = ss?.summary?.score ?? 0;
    if (ss?.summary && score < weakestScore) {
      weakestScore = score;
      weakestKey = stage;
    }
  }
  for (const stage of STAGE_ORDER) {
    const ss = stages[stage];
    const score = ss?.summary?.score ?? 0;
    let severity = 'Pending';
    if (ss?.summary) {
      severity = score >= 70 ? 'Strong' : score >= 40 ? 'Weak' : 'Critical';
    }
    scores.push({
      key: stage,
      stage: STAGE_LABEL_DISPLAY[stage],
      score,
      severity,
      weakest: stage === weakestKey,
    });
  }
  return scores;
}

function extractDomain(url: string): string {
  if (!url) return 'your site';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'your site';
  }
}

function formatElapsed(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
  // Ref tracks the EventSource so we can close it from the message handler
  // when the scan reaches a terminal state (completed/failed). Without this,
  // EventSource auto-reconnects after the server closes the stream, replays
  // all events from scratch, and the ProgressIndicator re-mounts — yanking
  // the user back to the top of the page in an infinite loop.
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Don't open SSE if the scan is already in a terminal state
    if (state.status === 'completed' || state.status === 'failed') return;

    const es = new EventSource(`/api/scan/status/${scanId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as ScanSSEEvent;
        dispatch({ type: 'SSE_EVENT', event });

        // Terminal events — close SSE to prevent auto-reconnect loop
        if (event.type === 'scan_completed' || event.type === 'scan_failed') {
          es.close();
          esRef.current = null;
        }
      } catch {}
    };
    es.onerror = () => {};
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [scanId, state.status]);

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

  // ── Elapsed-time ticker for redesign ScanDesktop/Mobile ──
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const scanStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.status === 'connecting' || state.status === 'completed' || state.status === 'failed') return;
    if (scanStartRef.current === null) scanStartRef.current = Date.now();
    const id = window.setInterval(() => {
      const start = scanStartRef.current ?? Date.now();
      setElapsedSecs(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.status]);

  // ── Email submission for redesign CaptureGate ──
  const [captureSubmitting, setCaptureSubmitting] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const handleCaptureSubmit = async (email: string, phone: string) => {
    if (!email.trim() || captureSubmitting) return;
    setCaptureSubmitting(true);
    setCaptureError(null);
    try {
      const res = await fetch('/api/scan/capture-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId,
          leadId: state.leadId ?? '',
          email: email.trim(),
          phone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      const data = (await res.json()) as { lead: { id: string } };
      dispatch({
        type: 'EMAIL_CAPTURED',
        leadId: data.lead.id,
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
    } catch {
      setCaptureError('Something went wrong. Please try again.');
    } finally {
      setCaptureSubmitting(false);
    }
  };

  const isScanning =
    state.status === 'scanning' ||
    state.status === 'capturing' ||
    state.status === 'analyzing' ||
    state.status === 'connecting';
  const isComplete = state.status === 'completed';
  const isFailed = state.status === 'failed';
  const needsEmailGate = isComplete && !state.emailCaptured;

  // ── Redesign view-model derivations ──
  const redesignDomain = extractDomain(state.websiteUrl);
  const redesignMilestones = stagesToMilestones(state.stages, state.screenshots.length > 0);
  const redesignActivityLog = progressMessagesToActivityLog(state.progressMessages);
  const redesignThumbnails = screenshotsToRedesignThumbnails(state.screenshots);
  const redesignCurrent = latestScreenshotToCurrent(state.screenshots);
  const completedStageCount = STAGE_ORDER.filter(
    (s) => state.stages[s]?.status === 'completed',
  ).length;
  const redesignProgressPct = isScanning ? Math.round((completedStageCount / STAGE_ORDER.length) * 100) : 100;
  const redesignElapsed = formatElapsed(elapsedSecs);
  const redesignStageScores = stagesToScores(state.stages);
  const redesignTotalLeak = state.completedSummary
    ? `$${(state.completedSummary.criticalIssues * 18).toFixed(0)}k`
    : '$0';
  const redesignFindingCount = STAGE_ORDER.reduce(
    (sum, s) => sum + (state.stages[s]?.summary?.findings?.length ?? 0),
    0,
  );
  const redesignVoiceAgentName = '[VOICE_AGENT_NAME]';
  void redesignVoiceAgentName; // reserved for prop wiring later

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

  // ── REDESIGN RENDER (v2) — wired to live SSE/state ──
  // Renders new ScanDesktop/Mobile, CaptureGate, ResultsDesktop/Mobile
  // composing from the same reducer state the legacy UI used.
  return (
    <div className="min-h-screen" style={{ background: 'var(--base)' }}>
      {/* Failed state */}
      {isFailed && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 80 }}>
          <h2 className="display-900" style={{ fontSize: 32 }}>Scan failed</h2>
          <p className="body" style={{ color: 'var(--text-2)', marginTop: 12 }}>
            {state.error || 'Something went wrong. Please try again.'}
          </p>
        </div>
      )}

      {/* Scanning state — live milestones, screenshots, activity log */}
      {isScanning && (
        <>
          <ScanDesktop
            scanId={scanId}
            domain={redesignDomain}
            milestones={redesignMilestones}
            activityLog={redesignActivityLog}
            currentScreenshot={redesignCurrent}
            thumbnails={redesignThumbnails}
            elapsed={redesignElapsed}
            progressPct={redesignProgressPct}
          />
          <ScanMobile
            scanId={scanId}
            domain={redesignDomain}
            milestones={redesignMilestones}
            currentScreenshot={redesignCurrent}
            elapsed={redesignElapsed}
            progressPct={redesignProgressPct}
          />
        </>
      )}

      {/* Email gate — full-screen capture modal blocks results until email submitted */}
      {needsEmailGate && (
        <>
          {/* Desktop variant */}
          <div className="scan-desktop">
            <CaptureGate
              findingCount={redesignFindingCount || 17}
              stageCount={STAGE_ORDER.length}
              onSubmit={(email, phone) => {
                void handleCaptureSubmit(email, phone);
              }}
            />
          </div>
          {/* Mobile variant */}
          <div className="scan-mobile">
            <CaptureGate
              mobile
              findingCount={redesignFindingCount || 17}
              stageCount={STAGE_ORDER.length}
              onSubmit={(email, phone) => {
                void handleCaptureSubmit(email, phone);
              }}
            />
          </div>
          {captureError && (
            <div
              role="alert"
              style={{
                position: 'fixed',
                top: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--critical)',
                color: '#FAFAF7',
                padding: '10px 18px',
                borderRadius: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                zIndex: 60,
              }}
            >
              {captureError}
            </div>
          )}
          {captureSubmitting && (
            <div
              style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--ink)',
                color: 'var(--ink-text)',
                padding: '8px 16px',
                borderRadius: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                zIndex: 60,
              }}
            >
              Sending...
            </div>
          )}
        </>
      )}

      {/* Results state — email captured, full results visible */}
      {isComplete && state.emailCaptured && (
        <>
          <ResultsDesktop
            scanShortId={scanId.slice(0, 8)}
            domain={redesignDomain}
            totalLeak={redesignTotalLeak}
            findingCount={redesignFindingCount}
            stageCount={STAGE_ORDER.length}
            stageScores={redesignStageScores}
            onBookCall={() => handleOpenCalcom('redesign_results_book_call')}
            onShare={() => {
              if (typeof navigator !== 'undefined' && navigator.share) {
                void navigator.share({
                  title: 'My funnel audit',
                  url: window.location.href,
                });
              } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                void navigator.clipboard.writeText(window.location.href);
              }
            }}
            onViewBlueprint={() => {
              const el = document.getElementById('blueprint');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <ResultsMobile
            totalLeak={redesignTotalLeak}
            findingCount={redesignFindingCount}
            stageCount={STAGE_ORDER.length}
            stageScores={redesignStageScores}
            onBookCall={() => handleOpenCalcom('redesign_results_book_call')}
            onViewBlueprint={() => {
              const el = document.getElementById('blueprint');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Blueprint section — wired to real data when available */}
          {state.blueprintData && (
            <div id="blueprint">
              <BlueprintView blueprint={state.blueprintData} />
              <div className="blueprint-redesign-desktop hidden md:block">
                <BlueprintDesktop
                  weakestStage={state.blueprintData.diagram?.weakest_stage}
                  industry={state.blueprintData.diagram?.industry}
                  onBookCall={() => handleOpenCalcom('redesign_blueprint_book_call')}
                />
              </div>
              <div className="blueprint-redesign-mobile block md:hidden">
                <BlueprintMobile
                  weakestStage={state.blueprintData.diagram?.weakest_stage}
                  onBookCall={() => handleOpenCalcom('redesign_blueprint_book_call')}
                />
              </div>
            </div>
          )}

          {/* Blueprint generator CTA — visible when not yet generated */}
          {!state.blueprintData && (
            <section style={{ padding: '40px 48px', maxWidth: 1100, margin: '0 auto' }}>
              <BlueprintCTA
                scanId={scanId}
                blueprintAvailable={state.blueprintAvailable}
                onGenerated={(blueprint) =>
                  dispatch({ type: 'BLUEPRINT_GENERATED', blueprint })
                }
              />
            </section>
          )}
        </>
      )}

      {/* Social confirmation popup (preserves existing behavior) */}
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

      {/* Chat — only after email captured (preserves SSE-driven ChatContainer) */}
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
