/**
 * AEO (Answer Engine Optimization) Analyzer
 *
 * Analyzes HTML content for featured snippet and voice search readiness —
 * how well the site content targets answer engines (Google Featured Snippets,
 * People Also Ask, voice assistants, AI-generated answers).
 *
 * Uses Haiku for fast HTML analysis (no vision needed).
 */

import { analyzeWithHaiku, extractJSON } from '../ai/client';
import type { StageFinding, AnnotationType } from '../../../contracts/types';

// ── Types ──────────────────────────────────────────────

export interface AeoAnalysisResult {
  /** Overall AEO readiness score (0-100) */
  score: number;
  /** Human-readable headline summarizing AEO state */
  headline: string;
  /** Individual check results */
  checks: AeoCheck[];
  /** Synthesized findings for the prescription engine */
  findings: StageFinding[];
}

export interface AeoCheck {
  id: string;
  name: string;
  status: 'pass' | 'partial' | 'fail' | 'missing';
  detail: string;
  /** Weight of this check in the overall score */
  weight: number;
}

// ── Prompt ─────────────────────────────────────────────

const AEO_SYSTEM_PROMPT = `You are an expert in Answer Engine Optimization (AEO) — the practice of structuring web content to win featured snippets, People Also Ask boxes, voice search answers, and AI-generated answer panels.

Analyze the provided HTML and evaluate these AEO signals:

1. **Question-Format Headings** (weight: 25)
   - H2/H3 tags that use question format ("How does...", "What is...", "Why should...")
   - These directly target PAA (People Also Ask) and voice search queries
   - Status: pass (3+ question headings), partial (1-2), fail (none)

2. **Concise Answer Paragraphs** (weight: 20)
   - First paragraph after a question heading should be a direct, 40-60 word answer
   - Google extracts these for featured snippets
   - Status: pass (multiple concise answers), partial (some), fail (no concise answer patterns)

3. **List & Table Formatting** (weight: 15)
   - Ordered/unordered lists for step-by-step content
   - Tables for comparison data
   - These formats are preferred by featured snippet algorithms
   - Status: pass (multiple lists/tables), partial (some), fail (none)

4. **Definition Patterns** (weight: 15)
   - "X is..." or "X refers to..." patterns near headings
   - Clear definitions that AI can extract as authoritative answers
   - Status: pass (clear definitions), partial (some), fail (none)

5. **Content Freshness Signals** (weight: 10)
   - Published date, last updated date, copyright year
   - Answer engines prefer recent, maintained content
   - Status: pass (recent dates visible), partial (dates exist but old), fail (no dates)

6. **Voice Search Readiness** (weight: 15)
   - Conversational tone in answers
   - Location + service keywords for "near me" queries
   - Short, speakable answer blocks (under 30 words for key claims)
   - Local business schema for voice assistant results
   - Status: pass (multiple voice signals), partial (some), fail (none)

Return JSON only:
{
  "checks": [
    {
      "id": "question_headings",
      "name": "Question-Format Headings",
      "status": "pass|partial|fail|missing",
      "detail": "What was found or missing — be specific, cite examples from the HTML",
      "weight": 25
    }
  ],
  "headline": "One sentence summarizing AEO readiness — specific to this site"
}

Include all 6 checks. Be specific about what you found — cite actual examples from the HTML.`;

// ── Score calculation ──────────────────────────────────

function calculateAeoScore(checks: AeoCheck[]): number {
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

function checksToFindings(checks: AeoCheck[]): StageFinding[] {
  const findings: StageFinding[] = [];

  for (const check of checks) {
    if (check.status === 'pass') {
      findings.push({
        id: `aeo-${check.id}`,
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
      id: `aeo-${check.id}`,
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
 * Analyze page HTML for AEO (Answer Engine Optimization) readiness.
 * Returns null if no HTML is available.
 */
export async function analyzeAeo(html: string): Promise<AeoAnalysisResult | null> {
  if (!html || html.length < 100) return null;

  // Truncate HTML to avoid token limits — first 30k chars covers most pages
  const truncatedHtml = html.slice(0, 30000);

  try {
    const response = await analyzeWithHaiku({
      systemPrompt: AEO_SYSTEM_PROMPT,
      userPrompt: `Analyze this page HTML for AEO readiness:\n\n${truncatedHtml}`,
      maxTokens: 2048,
    });

    const result = extractJSON<{
      checks: AeoCheck[];
      headline: string;
    }>(response);

    const checks = result.checks ?? [];
    const score = calculateAeoScore(checks);
    const findings = checksToFindings(checks);

    return {
      score,
      headline: result.headline ?? 'AEO analysis complete.',
      checks,
      findings,
    };
  } catch (error) {
    console.error('[analyze-aeo] AEO analysis failed:', error);
    return {
      score: 0,
      headline: 'AEO analysis could not be completed.',
      checks: [],
      findings: [{
        id: 'aeo-error',
        title: 'AEO analysis could not be completed',
        detail: 'The answer engine check encountered an error. This will be re-analyzed on the next scan.',
        type: 'warning',
        impact: 'low',
      }],
    };
  }
}
