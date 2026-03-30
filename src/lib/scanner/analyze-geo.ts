/**
 * GEO (Generative Engine Optimization) Analyzer
 *
 * Analyzes HTML content for AI search readiness — how well the site is structured
 * for consumption by generative AI systems (ChatGPT, Perplexity, Google AI Overview,
 * Apple Intelligence).
 *
 * Uses Haiku for fast HTML analysis (no vision needed).
 */

import { analyzeWithHaiku, extractJSON } from '../ai/client';
import type { StageFinding, AnnotationType } from '../../../contracts/types';

// ── Types ──────────────────────────────────────────────

export interface GeoAnalysisResult {
  /** Overall GEO readiness score (0-100) */
  score: number;
  /** Human-readable headline summarizing GEO state */
  headline: string;
  /** Individual check results */
  checks: GeoCheck[];
  /** Synthesized findings for the prescription engine */
  findings: StageFinding[];
}

export interface GeoCheck {
  id: string;
  name: string;
  status: 'pass' | 'partial' | 'fail' | 'missing';
  detail: string;
  /** Weight of this check in the overall score */
  weight: number;
}

// ── Prompt ─────────────────────────────────────────────

const GEO_SYSTEM_PROMPT = `You are an expert in Generative Engine Optimization (GEO) — the practice of optimizing web content so AI systems (ChatGPT, Google AI Overview, Perplexity, Apple Intelligence, Bing Copilot) can consume, cite, and recommend it.

Analyze the provided HTML and evaluate these GEO signals:

1. **Schema.org Structured Data** (weight: 25)
   - Check for JSON-LD or microdata (Organization, LocalBusiness, Product, FAQ, HowTo, Article, Review, BreadcrumbList)
   - More schema types = better AI understanding
   - Status: pass (3+ types), partial (1-2 types), fail (none)

2. **FAQ / Q&A Content** (weight: 20)
   - Check for FAQ sections, question-answer patterns, FAQ schema
   - AI models extract these directly for answers
   - Status: pass (FAQ schema + content), partial (Q&A content but no schema), fail (none)

3. **Entity Clarity** (weight: 20)
   - Clear business name, description, location, services, contact
   - Consistent entity references throughout the page
   - About page or prominent "who we are" section
   - Status: pass (clear, consistent), partial (some present), fail (unclear/missing)

4. **Content Authority Signals** (weight: 15)
   - Author attribution, credentials, expertise signals
   - Citations, references, data points
   - Published/updated dates
   - Status: pass (multiple signals), partial (some), fail (none)

5. **Topical Depth** (weight: 10)
   - Substantive content (not just landing page fluff)
   - Specific claims with evidence
   - Industry terminology used correctly
   - Status: pass (deep, specific), partial (surface level), fail (thin/generic)

6. **AI-Extractable Structure** (weight: 10)
   - Proper heading hierarchy (H1→H2→H3)
   - Semantic HTML elements (article, section, nav, main)
   - Clean content blocks (not buried in JS frameworks)
   - Status: pass (clean structure), partial (some issues), fail (poor structure)

Return JSON only:
{
  "checks": [
    {
      "id": "schema_markup",
      "name": "Schema.org Structured Data",
      "status": "pass|partial|fail|missing",
      "detail": "What was found or missing — be specific",
      "weight": 25
    }
  ],
  "headline": "One sentence summarizing GEO readiness — specific to this site"
}

Include all 6 checks. Be specific about what you found — don't give generic advice.`;

// ── Score calculation ──────────────────────────────────

function calculateGeoScore(checks: GeoCheck[]): number {
  let earned = 0;
  let total = 0;

  for (const check of checks) {
    total += check.weight;
    switch (check.status) {
      case 'pass':
        earned += check.weight;
        break;
      case 'partial':
        earned += check.weight * 0.5;
        break;
      case 'fail':
      case 'missing':
        break;
    }
  }

  return total > 0 ? Math.round((earned / total) * 100) : 0;
}

// ── Convert checks to findings ─────────────────────────

function checksToFindings(checks: GeoCheck[]): StageFinding[] {
  const findings: StageFinding[] = [];

  for (const check of checks) {
    if (check.status === 'pass') {
      findings.push({
        id: `geo-${check.id}`,
        title: `${check.name}: optimized`,
        detail: check.detail,
        type: 'positive' as AnnotationType,
        impact: 'low',
      });
      continue;
    }

    const severity: AnnotationType =
      check.status === 'fail' || check.status === 'missing'
        ? check.weight >= 20 ? 'critical' : 'warning'
        : 'opportunity';

    const impact = check.weight >= 20 ? 'high' : check.weight >= 15 ? 'medium' : 'low';

    findings.push({
      id: `geo-${check.id}`,
      title: `${check.name}: ${check.status === 'partial' ? 'needs improvement' : 'missing'}`,
      detail: check.detail,
      type: severity,
      impact: impact as 'high' | 'medium' | 'low',
    });
  }

  // Sort: critical first, then warning, then opportunity, then positive
  const order: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, positive: 3 };
  return findings.sort((a, b) => (order[a.type] ?? 4) - (order[b.type] ?? 4));
}

// ── Main analyzer ──────────────────────────────────────

/**
 * Analyze page HTML for GEO (Generative Engine Optimization) readiness.
 * Returns null if no HTML is available.
 */
export async function analyzeGeo(html: string): Promise<GeoAnalysisResult | null> {
  if (!html || html.length < 100) return null;

  // Truncate HTML to avoid token limits — first 30k chars covers most pages
  const truncatedHtml = html.slice(0, 30000);

  try {
    const response = await analyzeWithHaiku({
      systemPrompt: GEO_SYSTEM_PROMPT,
      userPrompt: `Analyze this page HTML for GEO readiness:\n\n${truncatedHtml}`,
      maxTokens: 2048,
    });

    const result = extractJSON<{
      checks: GeoCheck[];
      headline: string;
    }>(response);

    const checks = result.checks ?? [];
    const score = calculateGeoScore(checks);
    const findings = checksToFindings(checks);

    return {
      score,
      headline: result.headline ?? 'GEO analysis complete.',
      checks,
      findings,
    };
  } catch (error) {
    console.error('[analyze-geo] GEO analysis failed:', error);
    return {
      score: 0,
      headline: 'GEO analysis could not be completed.',
      checks: [],
      findings: [{
        id: 'geo-error',
        title: 'GEO analysis could not be completed',
        detail: 'The AI discoverability check encountered an error. This will be re-analyzed on the next scan.',
        type: 'warning',
        impact: 'low',
      }],
    };
  }
}
