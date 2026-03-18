// /src/lib/scanner/stage-offer.ts
// Offer & Conversion stage analyzer
// Analyzes pricing pages, service pages, and product offerings

import type {
  Annotation,
  FunnelStage,
  FunnelStageResult,
  ScreenshotData,
  StageSummary,
} from '@/../../contracts/types';
import { annotateStageScreenshots, generateStageSummary } from '../ai/annotate';
import { createStageResult } from './utils';

const STAGE: FunnelStage = 'offer';

export type StageUpdateCallback = (
  stage: FunnelStage,
  update: Partial<FunnelStageResult>,
) => Promise<void>;

export type AnnotationReadyCallback = (
  screenshotId: string,
  annotations: Annotation[],
) => Promise<void>;

// ============================================================
// Main offer stage analysis
// ============================================================

export interface OfferStageInput {
  screenshots: ScreenshotData[];
  screenshotFetcher: (storageUrl: string) => Promise<string>;
  businessContext?: string;
}

export async function analyzeOfferStage(
  input: OfferStageInput,
  onUpdate: StageUpdateCallback,
  onAnnotationReady?: AnnotationReadyCallback,
): Promise<FunnelStageResult> {
  const { screenshots, screenshotFetcher, businessContext } = input;

  if (screenshots.length === 0) {
    const summary: StageSummary = {
      exists: false,
      score: 0,
      headline: 'No pricing, services, or product page was found for analysis.',
      findings: [
        {
          id: 'offer-no-page',
          title: 'No visible offer or pricing page',
          detail:
            'We couldn\'t find a dedicated pricing, services, or product page. Without a clear offer page, visitors don\'t know what they\'re buying or how much it costs — a major barrier to conversion. Even service businesses benefit from transparent pricing ranges.',
          type: 'critical',
          impact: 'high',
        },
        {
          id: 'offer-hidden-pricing',
          title: 'Pricing may be hidden behind "Contact Us"',
          detail:
            'If pricing requires contacting the business, this creates friction. Studies show 80% of B2B buyers want to see pricing before reaching out. Consider showing starting prices or package ranges.',
          type: 'opportunity',
          impact: 'medium',
        },
      ],
    };
    const result = createStageResult(STAGE, 'completed', summary, []);
    await onUpdate(STAGE, result);
    return result;
  }

  await onUpdate(STAGE, { status: 'analyzing', startedAt: new Date().toISOString() });

  // Annotate screenshots
  const inputs: Array<{ id: string; base64: string }> = [];
  for (const screenshot of screenshots) {
    try {
      const base64 = await screenshotFetcher(screenshot.storageUrl);
      inputs.push({ id: screenshot.id, base64 });
    } catch (error) {
      console.error(`[stage-offer] Failed to fetch screenshot ${screenshot.id}:`, error);
    }
  }

  const annotationMap = await annotateStageScreenshots(inputs, STAGE, businessContext);

  // Emit annotation events and collect
  const allAnnotations: Annotation[] = [];
  const updatedScreenshots = [...screenshots];

  for (let i = 0; i < updatedScreenshots.length; i++) {
    const annotations = annotationMap.get(updatedScreenshots[i].id);
    if (annotations) {
      updatedScreenshots[i] = {
        ...updatedScreenshots[i],
        annotations,
        analyzedAt: new Date().toISOString(),
      };
      allAnnotations.push(...annotations);

      if (onAnnotationReady) {
        await onAnnotationReady(updatedScreenshots[i].id, annotations);
      }
    }
  }

  const summary = await generateStageSummary(
    STAGE,
    allAnnotations,
    screenshots.length,
    businessContext,
  );

  const result = createStageResult(STAGE, 'completed', summary, updatedScreenshots);
  await onUpdate(STAGE, result);
  return result;
}
