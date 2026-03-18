// /src/lib/blueprint/brand-extractor.ts
// Extract brand colors from a homepage screenshot using Sonnet vision

import type { BlueprintData } from '@/../../contracts/types';
import { analyzeWithSonnet, extractJSON } from '../ai/client';

// The color palette shape matches BlueprintData['brandColors']
export type BrandColors = BlueprintData['brandColors'];

interface RawBrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// ============================================================
// Extract brand colors from a screenshot
// ============================================================

export async function extractBrandColors(
  screenshotBase64: string,
): Promise<BrandColors> {
  const result = await analyzeWithSonnet({
    systemPrompt: `You are a brand identity and color analysis expert. Analyze this screenshot of a website and extract the brand's color palette.

WHAT TO LOOK FOR:
- **Primary color**: The dominant brand color used in the logo, headers, or key branding elements. This is the color that defines the brand identity.
- **Secondary color**: A supporting color used alongside the primary. Often used for secondary buttons, accents, or complementary sections.
- **Accent color**: A highlight color used sparingly for CTAs, links, badges, or emphasis. Should contrast with primary/secondary.
- **Background color**: The main background color of the page. Could be white, off-white, dark, or any color that forms the canvas.
- **Text color**: The primary body text color. Usually a dark shade on light backgrounds or light shade on dark backgrounds.

RULES:
- Return EXACT hex color codes (e.g., "#1A2B3C"), not named colors.
- If the site uses a single dominant color, use lighter/darker variants for secondary.
- If you can't determine a color, make a reasonable inference from what's visible.
- Prefer the most distinctive brand colors over generic blacks/whites.

Return ONLY valid JSON:
{
  "primary": "#XXXXXX",
  "secondary": "#XXXXXX",
  "accent": "#XXXXXX",
  "background": "#XXXXXX",
  "text": "#XXXXXX"
}`,
    userPrompt: 'Extract the brand color palette from this website screenshot.',
    images: [
      {
        type: 'base64',
        media_type: 'image/png',
        data: screenshotBase64,
      },
    ],
    maxTokens: 512,
  });

  try {
    const parsed = extractJSON<RawBrandColors>(result);
    return validateBrandColors(parsed);
  } catch (error) {
    console.error('[brand-extractor] Failed to parse brand colors:', error);
    return getDefaultBrandColors();
  }
}

// ============================================================
// Validation
// ============================================================

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function validateBrandColors(raw: RawBrandColors): BrandColors {
  return {
    primary: isValidHex(raw.primary) ? raw.primary : '#2563EB',
    secondary: isValidHex(raw.secondary) ? raw.secondary : '#1E40AF',
    accent: isValidHex(raw.accent) ? raw.accent : '#F59E0B',
    background: isValidHex(raw.background) ? raw.background : '#FFFFFF',
    text: isValidHex(raw.text) ? raw.text : '#1F2937',
  };
}

function isValidHex(color: string): boolean {
  return typeof color === 'string' && HEX_PATTERN.test(color);
}

function getDefaultBrandColors(): BrandColors {
  return {
    primary: '#2563EB',
    secondary: '#1E40AF',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
  };
}
