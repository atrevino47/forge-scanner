// /src/lib/blueprint/mockup-generator.ts
// Generates a professional HTML/CSS mockup of the client's weakest funnel piece
// redesigned for maximum conversion using their brand identity

import type {
  BlueprintData,
  FunnelMapData,
  FunnelStage,
  ScanResult,
  StageFinding,
} from '@/../../contracts/types';
import { analyzeWithSonnet } from '../ai/client';
import { getMockupPrompt } from '../prompts/mockup';
import { extractBrandColors, type BrandColors } from './brand-extractor';
import { generateFunnelMap } from './funnel-map';

// ============================================================
// Generate complete blueprint (funnel map + mockup)
// ============================================================

export interface GenerateBlueprintInput {
  scanResult: ScanResult;
  homepageScreenshotBase64: string;
  businessName?: string | null;
  industry?: string;
}

export async function generateBlueprint(
  input: GenerateBlueprintInput,
): Promise<BlueprintData> {
  const { scanResult, homepageScreenshotBase64, businessName, industry } = input;

  // Step 1 & 2: Generate funnel map and extract brand colors in parallel
  const [funnelMap, brandColors] = await Promise.all([
    generateFunnelMap(scanResult, businessName),
    extractBrandColors(homepageScreenshotBase64),
  ]);

  // Step 3: Generate mockup for the weakest stage
  const { mockupHtml, mockupTarget } = await generateMockup({
    scanResult,
    funnelMap,
    brandColors,
    businessName: businessName || extractBusinessName(scanResult.websiteUrl),
    industry,
  });

  return {
    id: crypto.randomUUID(),
    scanId: scanResult.id,
    funnelMap,
    mockupHtml,
    mockupTarget,
    brandColors,
    createdAt: new Date().toISOString(),
  };
}

// ============================================================
// Generate HTML mockup for the weakest funnel piece
// ============================================================

interface MockupGenerationInput {
  scanResult: ScanResult;
  funnelMap: FunnelMapData;
  brandColors: BrandColors;
  businessName: string;
  industry?: string;
}

interface MockupResult {
  mockupHtml: string;
  mockupTarget: string;
}

async function generateMockup(input: MockupGenerationInput): Promise<MockupResult> {
  const { scanResult, funnelMap, brandColors, businessName, industry } = input;

  // Identify the weakest stage from the funnel map
  const targetStage = funnelMap.biggestGap;
  const targetNode = funnelMap.nodes.find((n) => n.stage === targetStage);

  if (!targetNode) {
    return {
      mockupHtml: getFallbackMockupHtml(businessName, brandColors),
      mockupTarget: `${targetStage} stage (fallback)`,
    };
  }

  // Gather findings for the target stage
  const stageResult = scanResult.stages.find((s) => s.stage === targetStage);
  const findings: StageFinding[] = stageResult?.summary?.findings ?? [];

  const mockupTarget = getMockupTargetDescription(targetStage, targetNode.label);

  const prompt = getMockupPrompt({
    targetStage,
    stageNode: targetNode,
    findings,
    businessName,
    websiteUrl: scanResult.websiteUrl,
    brandColors,
    industry,
  });

  const result = await analyzeWithSonnet({
    systemPrompt: prompt,
    userPrompt: `Generate the complete HTML mockup for ${businessName}'s ${targetNode.label} redesign. Remember: return ONLY the HTML document, no explanations.`,
    maxTokens: 8192,
  });

  const html = extractHtml(result);

  if (!html) {
    console.error('[mockup-generator] Failed to extract HTML from AI response');
    return {
      mockupHtml: getFallbackMockupHtml(businessName, brandColors),
      mockupTarget: `${mockupTarget} (fallback)`,
    };
  }

  return {
    mockupHtml: html,
    mockupTarget,
  };
}

// ============================================================
// HTML extraction and validation
// ============================================================

function extractHtml(raw: string): string | null {
  // Try to find a complete HTML document
  const htmlMatch = raw.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  // Try without DOCTYPE
  const htmlTagMatch = raw.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) {
    return `<!DOCTYPE html>\n${htmlTagMatch[1]}`;
  }

  // If the response starts with < and looks like HTML, wrap it
  const trimmed = raw.trim();
  if (trimmed.startsWith('<') && trimmed.includes('</')) {
    return `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body>\n${trimmed}\n</body>\n</html>`;
  }

  // Extract from markdown code fences
  const fenceMatch = raw.match(/```(?:html)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch && fenceMatch[1].includes('<')) {
    return extractHtml(fenceMatch[1]);
  }

  return null;
}

// ============================================================
// Helpers
// ============================================================

function getMockupTargetDescription(stage: FunnelStage, label: string): string {
  const descriptions: Record<FunnelStage, string> = {
    traffic: `Social profile redesign — optimized ${label.toLowerCase()} for maximum traffic generation`,
    landing: `Homepage redesign — conversion-optimized ${label.toLowerCase()} with clear value proposition and CTA`,
    capture: `Lead capture redesign — high-converting opt-in with lead magnet and minimal friction`,
    offer: `Pricing page redesign — clear, compelling ${label.toLowerCase()} with social proof and risk reversal`,
    followup: `Follow-up email template — personalized nurture sequence leveraging scan findings`,
  };
  return descriptions[stage];
}

function extractBusinessName(url: string): string {
  try {
    const hostname = new URL(
      url.startsWith('http') ? url : `https://${url}`,
    ).hostname;
    // Remove www. and TLD, capitalize
    const name = hostname
      .replace(/^www\./, '')
      .split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'Business';
  }
}

function getFallbackMockupHtml(businessName: string, colors: BrandColors): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} — Optimized by Forge</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: ${colors.background};
      color: ${colors.text};
      line-height: 1.6;
    }
    .hero {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 60px 24px;
      background: linear-gradient(135deg, ${colors.primary}08, ${colors.accent}08);
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.03em;
      background: ${colors.accent}18;
      color: ${colors.accent};
      margin-bottom: 24px;
    }
    h1 {
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.1;
      max-width: 720px;
      margin-bottom: 20px;
      color: ${colors.text};
    }
    .subtitle {
      font-size: 18px;
      color: ${colors.text}99;
      max-width: 560px;
      margin-bottom: 36px;
    }
    .cta {
      display: inline-block;
      padding: 16px 36px;
      background: ${colors.accent};
      color: ${colors.background};
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .cta:hover { opacity: 0.9; }
    .watermark {
      position: fixed;
      bottom: 12px;
      right: 16px;
      font-size: 11px;
      color: ${colors.text}4D;
      font-family: system-ui, sans-serif;
      letter-spacing: 0.05em;
    }
    .watermark span { color: #D4A537; font-weight: 600; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="badge">[COPY: Category badge text]</div>
    <h1>[COPY: Compelling headline addressing the primary pain point of ${businessName}'s target audience]</h1>
    <p class="subtitle">[COPY: Supporting subtitle that communicates the key benefit and builds on the headline promise]</p>
    <a href="#" class="cta">[COPY: Specific action-oriented CTA text]</a>
  </section>
  <div class="watermark">Built by <span>Forge</span></div>
</body>
</html>`;
}
