// /src/lib/scanner/stage-capture.ts
// Lead Capture stage analyzer
// Analyzes forms, CTAs, lead magnets, and conversion elements

import type {
  Annotation,
  FunnelStage,
  FunnelStageResult,
  ScreenshotData,
  StageSummary,
} from '@/../../contracts/types';
import { annotateStageScreenshots, generateStageSummary } from '../ai/annotate';
import { analyzeWithHaiku, extractJSON } from '../ai/client';
import { createStageResult } from './utils';

const STAGE: FunnelStage = 'capture';

export type StageUpdateCallback = (
  stage: FunnelStage,
  update: Partial<FunnelStageResult>,
) => Promise<void>;

export type AnnotationReadyCallback = (
  screenshotId: string,
  annotations: Annotation[],
) => Promise<void>;

// ============================================================
// Form detection types (Haiku-powered)
// ============================================================

interface FormDetectionResult {
  formsFound: number;
  formDetails: Array<{
    fieldCount: number;
    hasEmailField: boolean;
    hasPhoneField: boolean;
    hasNameField: boolean;
    ctaText: string;
    placement: 'above_fold' | 'below_fold' | 'sidebar' | 'popup' | 'footer';
  }>;
  chatWidgetDetected: boolean;
  popupDetected: boolean;
  leadMagnetDetected: boolean;
  emailCaptureCount: number;
}

// ============================================================
// Main capture stage analysis
// ============================================================

export interface CaptureStageInput {
  screenshots: ScreenshotData[];
  screenshotFetcher: (storageUrl: string) => Promise<string>;
  businessContext?: string;
  pageHtml?: string;
}

export async function analyzeCaptureStage(
  input: CaptureStageInput,
  onUpdate: StageUpdateCallback,
  onAnnotationReady?: AnnotationReadyCallback,
): Promise<FunnelStageResult> {
  const { screenshots, screenshotFetcher, businessContext, pageHtml } = input;

  if (screenshots.length === 0) {
    const summary: StageSummary = {
      exists: false,
      score: 0,
      headline: 'No lead capture elements were detected on the website.',
      findings: [
        {
          id: 'capture-no-forms',
          title: 'No lead capture mechanism found',
          detail:
            'The website has no visible forms, email capture, or chat widgets. Every visitor who leaves without giving their contact info is a lost opportunity. Even a simple email opt-in with a lead magnet can capture 5-15% of traffic.',
          type: 'critical',
          impact: 'high',
        },
      ],
    };
    const result = createStageResult(STAGE, 'completed', summary, []);
    await onUpdate(STAGE, result);
    return result;
  }

  await onUpdate(STAGE, { status: 'analyzing', startedAt: new Date().toISOString() });

  // Run visual annotation and form detection in parallel
  const [annotationResults, formResults] = await Promise.allSettled([
    annotateScreenshots(screenshots, screenshotFetcher, businessContext, onAnnotationReady),
    pageHtml ? detectForms(pageHtml) : Promise.resolve(null),
  ]);

  // Collect annotations
  const allAnnotations: Annotation[] = [];
  const updatedScreenshots = [...screenshots];

  if (annotationResults.status === 'fulfilled') {
    const annotationMap = annotationResults.value;
    for (let i = 0; i < updatedScreenshots.length; i++) {
      const annotations = annotationMap.get(updatedScreenshots[i].id);
      if (annotations) {
        updatedScreenshots[i] = {
          ...updatedScreenshots[i],
          annotations,
          analyzedAt: new Date().toISOString(),
        };
        allAnnotations.push(...annotations);
      }
    }
  } else {
    console.error('[stage-capture] Annotation failed:', annotationResults.reason);
  }

  // Add form detection annotations
  if (formResults.status === 'fulfilled' && formResults.value) {
    allAnnotations.push(...formToAnnotations(formResults.value));
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

// ============================================================
// Internal helpers
// ============================================================

async function annotateScreenshots(
  screenshots: ScreenshotData[],
  screenshotFetcher: (url: string) => Promise<string>,
  businessContext?: string,
  onAnnotationReady?: AnnotationReadyCallback,
): Promise<Map<string, Annotation[]>> {
  const inputs: Array<{ id: string; base64: string }> = [];
  for (const screenshot of screenshots) {
    try {
      const base64 = await screenshotFetcher(screenshot.storageUrl);
      inputs.push({ id: screenshot.id, base64 });
    } catch (error) {
      console.error(`[stage-capture] Failed to fetch screenshot ${screenshot.id}:`, error);
    }
  }

  const results = await annotateStageScreenshots(inputs, STAGE, businessContext);

  if (onAnnotationReady) {
    for (const [screenshotId, annotations] of results) {
      await onAnnotationReady(screenshotId, annotations);
    }
  }

  return results;
}

async function detectForms(html: string): Promise<FormDetectionResult> {
  const truncatedHtml = html.slice(0, 15000);

  const result = await analyzeWithHaiku({
    systemPrompt: `You are a form and lead capture detection specialist. Analyze HTML to find all lead capture mechanisms.

Return ONLY valid JSON:
{
  "formsFound": <number of form elements>,
  "formDetails": [
    {
      "fieldCount": <number>,
      "hasEmailField": boolean,
      "hasPhoneField": boolean,
      "hasNameField": boolean,
      "ctaText": "submit button text",
      "placement": "above_fold" | "below_fold" | "sidebar" | "popup" | "footer"
    }
  ],
  "chatWidgetDetected": boolean (look for Drift, Intercom, Crisp, LiveChat, tawk.to, HubSpot chat scripts),
  "popupDetected": boolean (modal/popup scripts or overlay divs),
  "leadMagnetDetected": boolean (downloadable content offers, "free guide", "get the template", etc.),
  "emailCaptureCount": <number of distinct email input fields>
}`,
    userPrompt: `Analyze this HTML for lead capture elements:\n\n${truncatedHtml}`,
    maxTokens: 1024,
  });

  try {
    return extractJSON<FormDetectionResult>(result);
  } catch {
    return {
      formsFound: 0,
      formDetails: [],
      chatWidgetDetected: false,
      popupDetected: false,
      leadMagnetDetected: false,
      emailCaptureCount: 0,
    };
  }
}

function formToAnnotations(forms: FormDetectionResult): Annotation[] {
  const annotations: Annotation[] = [];

  if (forms.formsFound === 0) {
    annotations.push({
      id: 'capture-form-none',
      position: { x: 50, y: 60 },
      type: 'critical',
      title: 'No forms detected in page HTML',
      detail:
        'Zero form elements found in the page source. Without a form, the only conversion action is clicking a phone number or email link — this severely limits lead capture volume.',
      category: 'form_design',
    });
  }

  // Check for excessive form fields
  for (const form of forms.formDetails) {
    if (form.fieldCount > 5) {
      annotations.push({
        id: `capture-form-fields-${Math.random().toString(36).slice(2, 8)}`,
        position: { x: 50, y: 50 },
        type: 'warning',
        title: `Form has ${form.fieldCount} fields — too many`,
        detail: `Each additional form field reduces conversion rate by approximately 11%. A ${form.fieldCount}-field form is causing significant drop-off. Consider reducing to 3-4 essential fields.`,
        category: 'form_design',
      });
    }

    if (form.ctaText && isGenericCTA(form.ctaText)) {
      annotations.push({
        id: `capture-cta-generic-${Math.random().toString(36).slice(2, 8)}`,
        position: { x: 50, y: 55 },
        type: 'warning',
        title: `Generic CTA: "${form.ctaText}"`,
        detail: `Button text "${form.ctaText}" is generic and doesn't communicate value. Specific CTAs like "Get My Free Audit" or "Start Saving Today" convert 17-28% better than "Submit" or "Learn More".`,
        category: 'cta',
      });
    }
  }

  if (!forms.chatWidgetDetected) {
    annotations.push({
      id: 'capture-no-chat',
      position: { x: 95, y: 90 },
      type: 'opportunity',
      title: 'No live chat or chatbot detected',
      detail:
        'No chat widget found. Businesses using live chat see 20% more conversions on average. Even a simple chatbot can capture leads who don\'t want to fill out a form.',
      category: 'chat_widget',
    });
  }

  if (!forms.leadMagnetDetected) {
    annotations.push({
      id: 'capture-no-magnet',
      position: { x: 50, y: 70 },
      type: 'opportunity',
      title: 'No lead magnet or content offer',
      detail:
        'No downloadable content offer (guide, checklist, template) detected. Lead magnets increase email capture rate by 3-5x compared to a plain "subscribe" form because they provide immediate value.',
      category: 'lead_magnet',
    });
  }

  if (forms.chatWidgetDetected) {
    annotations.push({
      id: 'capture-chat-present',
      position: { x: 95, y: 90 },
      type: 'positive',
      title: 'Chat widget is active',
      detail:
        'A chat widget was detected, providing visitors an immediate way to engage. This is especially effective for high-intent visitors who have specific questions before converting.',
      category: 'chat_widget',
    });
  }

  return annotations;
}

function isGenericCTA(text: string): boolean {
  const genericPatterns = [
    'submit', 'send', 'learn more', 'click here', 'go',
    'next', 'continue', 'sign up', 'register',
  ];
  const lower = text.toLowerCase().trim();
  return genericPatterns.some((p) => lower === p || lower.startsWith(p));
}
