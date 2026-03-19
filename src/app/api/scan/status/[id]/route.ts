import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import type { ApiError } from '@/../contracts/api';
import type { ScanSSEEvent, ScanCompletedSummary } from '@/../contracts/events';
import type { DbScan, DbScreenshot, DbFunnelStage } from '@/lib/db/types';
import type { Annotation, DetectedSocials, SourceType } from '@/../contracts/types';

// ============================================================
// GET /api/scan/status/[id]
// Server-Sent Events endpoint for real-time scan progress.
// Polls the database every 1.5s and streams state changes.
// ============================================================

const POLL_INTERVAL_MS = 1500;
const TIMEOUT_MS = 300_000; // 5 minutes
const CAPTURE_PROMPT_DELAY_MS = 15_000;

interface SocialEntry {
  handle: string;
  url: string;
  confidence: 'high' | 'low';
}

function isSocialEntry(value: unknown): value is SocialEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'handle' in value &&
    'url' in value &&
    'confidence' in value &&
    typeof (value as SocialEntry).handle === 'string' &&
    typeof (value as SocialEntry).url === 'string' &&
    ((value as SocialEntry).confidence === 'high' ||
      (value as SocialEntry).confidence === 'low')
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response | NextResponse<ApiError>> {
  try {
    const { id: scanId } = await params;

    if (!scanId || scanId.length < 4) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'A valid scan ID is required.',
          },
        },
        { status: 400 }
      );
    }

    // Verify scan exists before opening the SSE stream
    const supabase = createServiceClient();
    const { data: existingScan, error: lookupError } = await supabase
      .from('scans')
      .select('id')
      .eq('id', scanId)
      .single();

    if (lookupError || !existingScan) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Scan ${scanId} not found.`,
          },
        },
        { status: 404 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const db = createServiceClient();

        let lastKnownStatus = '';
        let lastScreenshotCount = 0;
        let lastStageStatuses: Record<string, string> = {};
        let emittedAnnotationScreenshots = new Set<string>();
        let emittedSocialPlatforms = new Set<string>();
        let capturePromptSent = false;
        const startTime = Date.now();

        const sendEvent = (event: ScanSSEEvent): void => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          } catch {
            // Controller may be closed if client disconnected
          }
        };

        const cleanup = (intervalId: ReturnType<typeof setInterval>): void => {
          clearInterval(intervalId);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        };

        const pollInterval = setInterval(async () => {
          try {
            // --- Fetch current scan ---
            const { data: scan } = await db
              .from('scans')
              .select('*')
              .eq('id', scanId)
              .single<DbScan>();

            if (!scan) {
              cleanup(pollInterval);
              return;
            }

            // --- Emit scan_started on first poll ---
            if (!lastKnownStatus && scan.status) {
              sendEvent({ type: 'scan_started', url: scan.website_url });
              lastKnownStatus = scan.status;
            }

            // --- Check for new screenshots ---
            const { data: screenshots } = await db
              .from('screenshots')
              .select('*')
              .eq('scan_id', scanId)
              .order('created_at', { ascending: true })
              .returns<DbScreenshot[]>();

            const allScreenshots = screenshots ?? [];

            if (allScreenshots.length > lastScreenshotCount) {
              for (const ss of allScreenshots.slice(lastScreenshotCount)) {
                sendEvent({
                  type: 'screenshot_captured',
                  screenshotId: ss.id,
                  stage: ss.stage,
                  source: ss.source_type,
                  thumbnailUrl: ss.storage_url,
                  viewport: ss.viewport,
                });
              }
              lastScreenshotCount = allScreenshots.length;
            }

            // --- Send capture_prompt after delay ---
            if (!capturePromptSent && Date.now() - startTime > CAPTURE_PROMPT_DELAY_MS) {
              sendEvent({ type: 'capture_prompt' });
              capturePromptSent = true;
            }

            // --- Check for social detection (emit each platform once) ---
            if (scan.detected_socials && typeof scan.detected_socials === 'object') {
              const socials = scan.detected_socials as Record<string, unknown>;
              for (const [platform, data] of Object.entries(socials)) {
                if (platform === '_ambiguous') continue;
                if (!emittedSocialPlatforms.has(platform) && isSocialEntry(data)) {
                  sendEvent({
                    type: 'social_detected',
                    platform: platform as SourceType,
                    handle: data.handle,
                    url: data.url,
                    confidence: data.confidence,
                  });
                  emittedSocialPlatforms.add(platform);
                }
              }

              // --- Check for ambiguous socials (emit each platform once) ---
              const ambiguousData = socials._ambiguous as
                | Record<string, Array<{ handle: string; url: string }>>
                | undefined;
              if (ambiguousData && typeof ambiguousData === 'object') {
                for (const [platform, options] of Object.entries(ambiguousData)) {
                  const ambiguousKey = `ambiguous_${platform}`;
                  if (!emittedSocialPlatforms.has(ambiguousKey) && Array.isArray(options)) {
                    sendEvent({
                      type: 'social_ambiguous',
                      platform: platform as SourceType,
                      options,
                    });
                    emittedSocialPlatforms.add(ambiguousKey);
                  }
                }
              }
            }

            // --- Check funnel stage status changes ---
            const { data: stages } = await db
              .from('funnel_stages')
              .select('*')
              .eq('scan_id', scanId)
              .returns<DbFunnelStage[]>();

            const allStages = stages ?? [];

            for (const stage of allStages) {
              const prevStatus = lastStageStatuses[stage.stage];
              if (prevStatus !== stage.status) {
                if (stage.status === 'analyzing') {
                  sendEvent({
                    type: 'stage_analyzing',
                    stage: stage.stage,
                  });
                }
                if (stage.status === 'completed' && stage.summary) {
                  sendEvent({
                    type: 'stage_completed',
                    stage: stage.stage,
                    summary: stage.summary,
                  });
                }
                if (stage.status === 'failed') {
                  sendEvent({
                    type: 'stage_failed',
                    stage: stage.stage,
                    error: 'Stage analysis failed',
                  });
                }
                lastStageStatuses[stage.stage] = stage.status;
              }
            }

            // --- Check for annotations on screenshots (emit each once) ---
            for (const ss of allScreenshots) {
              if (
                ss.analyzed_at &&
                ss.annotations &&
                ss.annotations.length > 0 &&
                !emittedAnnotationScreenshots.has(ss.id)
              ) {
                sendEvent({
                  type: 'annotation_ready',
                  screenshotId: ss.id,
                  annotations: ss.annotations as Annotation[],
                });
                emittedAnnotationScreenshots.add(ss.id);
              }
            }

            // --- Check for completion or failure ---
            if (scan.status === 'completed' || scan.status === 'failed') {
              if (scan.status === 'completed') {
                const completedStages: DbFunnelStage[] = allStages.filter(
                  (s: DbFunnelStage) => s.status === 'completed'
                );
                const allAnnotations: Annotation[] = allScreenshots.flatMap(
                  (s: DbScreenshot) => (s.annotations ?? []) as Annotation[]
                );
                const criticalCount = allAnnotations.filter(
                  (a: Annotation) => a.type === 'critical'
                ).length;

                // Calculate overall health from stage scores
                const stageScores: number[] = completedStages
                  .filter((s: DbFunnelStage) => s.summary !== null)
                  .map((s: DbFunnelStage) => s.summary!.score);
                const overallHealth =
                  stageScores.length > 0
                    ? Math.round(
                        stageScores.reduce((sum: number, s: number) => sum + s, 0) /
                          stageScores.length
                      )
                    : 0;

                const stagesFound = completedStages.filter(
                  (s: DbFunnelStage) => s.summary?.exists !== false
                ).length;
                const stagesMissing = completedStages.filter(
                  (s: DbFunnelStage) => s.summary?.exists === false
                ).length;

                // Pick the top finding from the lowest-scoring stage
                const stagesWithSummary: DbFunnelStage[] = completedStages
                  .filter((s: DbFunnelStage) => s.summary !== null);
                const sortedStages = stagesWithSummary
                  .sort((a: DbFunnelStage, b: DbFunnelStage) => (a.summary!.score ?? 100) - (b.summary!.score ?? 100));
                const lowestStage = sortedStages[0];
                const topFinding =
                  lowestStage?.summary?.headline ?? 'Analysis complete';

                const summary: ScanCompletedSummary = {
                  overallHealth,
                  stagesFound,
                  stagesMissing,
                  criticalIssues: criticalCount,
                  topFinding,
                };

                sendEvent({ type: 'scan_completed', summary });
              } else {
                sendEvent({
                  type: 'scan_failed',
                  error: 'Scan failed',
                });
              }

              cleanup(pollInterval);
              return;
            }

            // --- Timeout after 5 minutes ---
            if (Date.now() - startTime > TIMEOUT_MS) {
              sendEvent({
                type: 'scan_failed',
                error: 'Scan timed out',
              });
              cleanup(pollInterval);
            }
          } catch (err) {
            console.error('[scan/status] Poll error:', err);
          }
        }, POLL_INTERVAL_MS);

        // Clean up on client disconnect via AbortSignal
        request.signal.addEventListener('abort', () => {
          cleanup(pollInterval);
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[scan/status] Unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to open scan status stream.',
          details:
            process.env.NODE_ENV === 'development' ? String(err) : undefined,
        },
      },
      { status: 500 }
    );
  }
}
