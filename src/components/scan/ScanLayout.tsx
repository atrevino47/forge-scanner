'use client';

import { useReducer, useEffect, useState, useRef } from 'react';
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
import { ResultsTopBar } from './ResultsTopBar';
import { StoryScrollContainer } from './story/StoryScrollContainer';

interface ScanState {
  status: ScanStatus | 'connecting';
  websiteUrl: string;
  stages: Partial<Record<FunnelStage, StageState>>;
  screenshots: ScreenshotEntry[];
  emailCaptured: boolean;
  leadId: string | null;
  capturedEmail: string | null;
  capturedPhone: string | null;
  completedSummary: ScanCompletedSummary | null;
  blueprintAvailable: boolean;
  blueprintData: BlueprintData | null;
  error: string | null;
  progressMessages: string[];
}

type ScanAction =
  | { type: 'SSE_EVENT'; event: ScanSSEEvent }
  | { type: 'INITIAL_DATA'; data: ScanResultsResponse }
  | { type: 'EMAIL_CAPTURED'; email: string }
  | { type: 'BLUEPRINT_GENERATED'; blueprint: BlueprintData };

const initialState: ScanState = {
  status: 'connecting',
  websiteUrl: '',
  stages: {},
  screenshots: [],
  emailCaptured: false,
  leadId: null,
  capturedEmail: null,
  capturedPhone: null,
  completedSummary: null,
  blueprintAvailable: false,
  blueprintData: null,
  error: null,
  progressMessages: [],
};

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
        sum +
        (s.summary?.findings.filter((f) => f.type === 'critical').length ?? 0),
      0,
    ),
    topFinding: withSummary[0]?.summary?.headline ?? '',
  };
}

function handleSSEEvent(state: ScanState, event: ScanSSEEvent): ScanState {
  switch (event.type) {
    case 'scan_started':
      return {
        ...state,
        status: 'scanning',
        websiteUrl: event.url,
        progressMessages: [
          ...state.progressMessages,
          'Starting your Revenue Audit…',
        ],
      };
    case 'page_discovered':
      return {
        ...state,
        stages: {
          ...state.stages,
          [event.stage]:
            state.stages[event.stage] ?? {
              status: 'pending' as StageStatus,
              summary: null,
            },
        },
        progressMessages: [
          ...state.progressMessages,
          `Discovering your ${STAGE_LABELS[event.stage]}…`,
        ],
      };
    case 'screenshot_captured': {
      if (state.screenshots.some((s) => s.id === event.screenshotId)) return state;
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
          `Capturing your ${SOURCE_LABELS[event.source] ?? event.source}…`,
        ],
      };
    }
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
          `Analyzing your ${STAGE_LABELS[event.stage]}…`,
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
          [event.stage]: {
            status: 'completed' as StageStatus,
            summary: event.summary,
          },
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
        progressMessages: [...state.progressMessages, 'Scan complete.'],
      };
    case 'scan_failed':
      return { ...state, status: 'failed', error: event.error };
    case 'blueprint_available':
      return { ...state, blueprintAvailable: true };
    default:
      return state;
  }
}

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'SSE_EVENT':
      return handleSSEEvent(state, action.event);
    case 'INITIAL_DATA': {
      const { scan, lead } = action.data;
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
        completedSummary:
          scan.status === 'completed' ? computeSummary(scan.stages) : null,
      };
    }
    case 'EMAIL_CAPTURED':
      return { ...state, emailCaptured: true, capturedEmail: action.email };
    case 'BLUEPRINT_GENERATED':
      return { ...state, blueprintData: action.blueprint };
    default:
      return state;
  }
}

export function ScanLayout({ scanId }: { scanId: string }) {
  const [state, dispatch] = useReducer(scanReducer, initialState);
  const { openCalcom } = useCalcom();

  const [socialsSubmitted, setSocialsSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/scan/results/${scanId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ScanResultsResponse | null) => {
        if (data) dispatch({ type: 'INITIAL_DATA', data });
      })
      .catch(() => {});
  }, [scanId]);

  const esRef = useRef<EventSource | null>(null);
  useEffect(() => {
    if (state.status === 'completed' || state.status === 'failed') return;
    const es = new EventSource(`/api/scan/status/${scanId}`);
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as ScanSSEEvent;
        dispatch({ type: 'SSE_EVENT', event });
        if (event.type === 'scan_completed' || event.type === 'scan_failed') {
          es.close();
          esRef.current = null;
        }
      } catch {}
    };
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [scanId, state.status]);

  const handleOpenCalcom = () =>
    openCalcom({
      email: state.capturedEmail ?? undefined,
      phone: state.capturedPhone ?? undefined,
      source: 'results_cta',
    });

  return (
    <div className="min-h-screen bg-forge-base">
      <ResultsTopBar
        onBookCall={handleOpenCalcom}
        scannedUrl={state.websiteUrl}
        showUrl={state.status === 'completed'}
      />

      <main className="pt-20 md:pt-24 px-0 w-full max-w-3xl mx-auto">
        {state.status === 'failed' && (
          <div className="mx-6 my-12 bg-forge-surface rounded-xl p-8 text-center">
            <h2 className="font-display mb-2 text-2xl tracking-display text-forge-text">
              Scan Failed
            </h2>
            <p className="text-forge-text-muted">
              {state.error || 'Something went wrong. Please try again.'}
            </p>
          </div>
        )}

        <StoryScrollContainer
          scanId={scanId}
          leadId={state.leadId}
          status={state.status}
          websiteUrl={state.websiteUrl}
          stages={state.stages}
          screenshots={state.screenshots}
          completedSummary={state.completedSummary}
          emailCaptured={state.emailCaptured}
          progressMessages={state.progressMessages}
          blueprintData={state.blueprintData}
          socialsSubmitted={socialsSubmitted}
          onSocialsComplete={() => setSocialsSubmitted(true)}
          onEmailCaptured={(email) =>
            dispatch({ type: 'EMAIL_CAPTURED', email })
          }
          onBook={handleOpenCalcom}
        />
      </main>
    </div>
  );
}
