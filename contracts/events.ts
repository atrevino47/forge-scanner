// contracts/events.ts
// SSE event types for real-time scan streaming
// Only the Orchestrator modifies this file

import type {
  FunnelStage,
  Annotation,
  StageFinding,
  StageSummary,
  SourceType,
  VideoAnalysis,
} from './types';

// ============================================================
// SCAN SSE EVENTS (/api/scan/status/[id])
// ============================================================

export type ScanSSEEvent =
  // Scan lifecycle
  | { type: 'scan_started'; url: string }
  | { type: 'scan_completed'; summary: ScanCompletedSummary }
  | { type: 'scan_failed'; error: string }

  // Page discovery
  | { type: 'page_discovered'; url: string; stage: FunnelStage }

  // Screenshot captures
  | {
      type: 'screenshot_captured';
      screenshotId: string;
      stage: FunnelStage;
      source: SourceType;
      thumbnailUrl: string;
      viewport: 'desktop' | 'mobile';
    }

  // Social detection
  | {
      type: 'social_detected';
      platform: SourceType;
      handle: string;
      url: string;
      confidence: 'high' | 'low';
    }
  | {
      type: 'social_ambiguous';
      platform: SourceType;
      options: Array<{ handle: string; url: string }>;
    }

  // Progressive capture trigger
  | { type: 'capture_prompt' }

  // Stage analysis
  | { type: 'stage_analyzing'; stage: FunnelStage }
  | {
      type: 'annotation_ready';
      screenshotId: string;
      annotations: Annotation[];
    }
  | {
      type: 'stage_completed';
      stage: FunnelStage;
      summary: StageSummary;
    }
  | { type: 'stage_failed'; stage: FunnelStage; error: string }

  // Video analysis (traffic stage)
  | {
      type: 'video_analysis';
      stage: 'traffic';
      platform: 'instagram' | 'tiktok' | 'youtube';
      analysis: VideoAnalysis;
    }

  // Blueprint availability
  | { type: 'blueprint_available' };

export interface ScanCompletedSummary {
  overallHealth: number; // 0-100
  stagesFound: number;
  stagesMissing: number;
  criticalIssues: number;
  topFinding: string;
}

// ============================================================
// CHAT SSE EVENTS (/api/chat/stream/[convId])
// ============================================================

export type ChatSSEEvent =
  | { type: 'typing_start' }
  | { type: 'token'; content: string }
  | { type: 'typing_end' }
  | {
      type: 'message_complete';
      messageId: string;
      content: string;
      metadata?: Record<string, unknown>;
    }
  | { type: 'data_card'; screenshotId: string; annotations: Annotation[] }
  | { type: 'calcom_embed'; url: string }
  | { type: 'error'; message: string };
