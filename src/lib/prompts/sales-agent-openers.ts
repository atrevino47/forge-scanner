// /src/lib/prompts/sales-agent-openers.ts
// Generates the first message the AI Sales Agent sends based on scan results and channel
// Every opener references the #1 most critical finding with a specific observation

import type { Channel, FunnelStage, ScanResult, StageFinding } from '@/../../contracts/types';

const STAGE_LABELS: Record<FunnelStage, string> = {
  traffic: 'traffic sources',
  landing: 'landing experience',
  capture: 'lead capture',
  offer: 'offer presentation',
  followup: 'follow-up system',
};

// ============================================================
// Generate channel-specific opener
// ============================================================

export function generateOpener(params: {
  scanResult: ScanResult;
  channel: Channel;
  businessName: string;
  leadName?: string | null;
  calcomUrl?: string;
}): string {
  const { scanResult, channel, businessName, leadName, calcomUrl } = params;

  const overallHealth = calculateOverallHealth(scanResult);
  const topCritical = findTopCriticalFinding(scanResult);
  const weakest = findWeakestStage(scanResult);
  const weakLabel = weakest ? STAGE_LABELS[weakest.stage] : 'funnel';
  const weakScore = weakest?.summary?.score ?? 0;

  switch (channel) {
    case 'web':
      return generateWebOpener({ businessName, leadName, overallHealth, topCritical, weakLabel, weakScore });
    case 'email':
      return generateEmailOpener({ businessName, leadName, overallHealth, topCritical, weakLabel, weakScore, calcomUrl, scanResult });
    case 'sms':
      return generateSMSOpener({ businessName, leadName, overallHealth, topCritical, weakLabel, weakScore, calcomUrl });
    case 'whatsapp':
      return generateWhatsAppOpener({ businessName, leadName, overallHealth, topCritical, weakLabel, weakScore, calcomUrl });
    case 'voice':
      return generateVoiceOpener({ businessName, leadName, overallHealth, topCritical, weakLabel, weakScore, scanResult });
  }
}

// ============================================================
// Web chat opener — consultative, references specific finding
// ============================================================

interface OpenerContext {
  businessName: string;
  leadName?: string | null;
  overallHealth: number;
  topCritical: StageFinding | null;
  weakLabel: string;
  weakScore: number;
  calcomUrl?: string;
  scanResult?: ScanResult;
}

function generateWebOpener(ctx: OpenerContext): string {
  const greeting = ctx.leadName ? `Hey ${ctx.leadName}` : 'Hey there';

  if (ctx.topCritical) {
    return `${greeting} — I just finished reviewing ${ctx.businessName}'s funnel scan. Your overall score is ${ctx.overallHealth}/100, and I found something in your ${ctx.weakLabel} that's worth looking at right away: ${ctx.topCritical.title.toLowerCase()}. ${ctx.topCritical.detail.split('.')[0]}. Want me to walk you through what I'd fix first?`;
  }

  if (ctx.weakScore < 50) {
    return `${greeting} — your funnel scan for ${ctx.businessName} is ready. Your overall score is ${ctx.overallHealth}/100, with your ${ctx.weakLabel} at ${ctx.weakScore}/100. There are some solid quick wins I spotted — want me to break down the top 3?`;
  }

  return `${greeting} — good news: ${ctx.businessName}'s funnel is in decent shape overall (${ctx.overallHealth}/100). There are still a few areas where you're leaving money on the table, especially in ${ctx.weakLabel}. Want me to show you the biggest opportunities?`;
}

// ============================================================
// Email opener — detailed, includes top findings
// ============================================================

function generateEmailOpener(ctx: OpenerContext): string {
  const greeting = ctx.leadName ? `Hi ${ctx.leadName}` : `Hi there`;
  const findings = ctx.scanResult?.stages
    .flatMap((s) => (s.summary?.findings ?? []).map((f) => ({ ...f, stage: s.stage })))
    .filter((f) => f.type === 'critical' || f.type === 'warning')
    .sort((a, b) => {
      const priority = { critical: 0, warning: 1, opportunity: 2, positive: 3 };
      return priority[a.type] - priority[b.type];
    })
    .slice(0, 3) ?? [];

  const findingsList = findings.length > 0
    ? findings.map((f, i) => `${i + 1}. **${f.title}** — ${f.detail.split('.').slice(0, 2).join('.')}.`).join('\n')
    : '';

  const calLine = ctx.calcomUrl
    ? `\n\nIf any of this resonates, I'd love to walk you through the full results in a free 30-minute strategy call: ${ctx.calcomUrl}`
    : '\n\nIf any of this resonates, you can book a free 30-minute strategy call directly from your results page.';

  return `${greeting},

I just ran a complete funnel analysis on ${ctx.businessName}'s digital presence, and I wanted to share the highlights.

**Your overall funnel health: ${ctx.overallHealth}/100**

The area with the biggest opportunity is your **${ctx.weakLabel}** (scored ${ctx.weakScore}/100). Here's what stood out:

${findingsList}

Your full annotated results — including screenshots with specific annotations — are ready for you to review.${calLine}

P.S. ${ctx.topCritical ? `Fixing "${ctx.topCritical.title.toLowerCase()}" alone could make a noticeable difference in your conversion rate.` : `Even small improvements to your ${ctx.weakLabel} could have a significant impact on your bottom line.`}`;
}

// ============================================================
// SMS opener — one insight + Cal.com link, <=160 chars
// ============================================================

function generateSMSOpener(ctx: OpenerContext): string {
  const finding = ctx.topCritical
    ? ctx.topCritical.title.toLowerCase()
    : `${ctx.weakLabel} scored ${ctx.weakScore}/100`;

  const base = `${ctx.businessName}: Your funnel scan found ${finding}.`;

  if (ctx.calcomUrl) {
    const withLink = `${base} Free strategy call: ${ctx.calcomUrl}`;
    // Respect SMS length — truncate finding if needed
    if (withLink.length <= 160) return withLink;
    const short = `${ctx.businessName}: Funnel scan ready — ${ctx.weakLabel} needs attention. Free call: ${ctx.calcomUrl}`;
    return short.slice(0, 160);
  }

  return `${base} Check your results to see the full breakdown.`.slice(0, 160);
}

// ============================================================
// WhatsApp opener — medium length, conversational
// ============================================================

function generateWhatsAppOpener(ctx: OpenerContext): string {
  const greeting = ctx.leadName ? `Hey ${ctx.leadName}` : 'Hey';

  const finding = ctx.topCritical
    ? `The biggest thing I spotted: *${ctx.topCritical.title.toLowerCase()}*. ${ctx.topCritical.detail.split('.')[0]}.`
    : `Your *${ctx.weakLabel}* scored ${ctx.weakScore}/100 — that's where most of the opportunity is.`;

  const calLine = ctx.calcomUrl
    ? `\n\nWant to hop on a quick call to go through it? Free 30 min, no strings: ${ctx.calcomUrl}`
    : '\n\nWant me to walk you through the key findings?';

  return `${greeting} — your funnel scan for *${ctx.businessName}* is ready.

Overall score: *${ctx.overallHealth}/100*

${finding}${calLine}`;
}

// ============================================================
// Voice opener — script for human sales team
// ============================================================

function generateVoiceOpener(ctx: OpenerContext): string {
  const findings = ctx.scanResult?.stages
    .flatMap((s) => (s.summary?.findings ?? []).map((f) => ({ ...f, stage: s.stage })))
    .filter((f) => f.type === 'critical')
    .slice(0, 3) ?? [];

  return `VOICE CALL SCRIPT — ${ctx.businessName}

GREETING: "${ctx.leadName ? `Hi ${ctx.leadName}` : 'Hi there'}, this is [Agent Name] from Forge. You recently ran a funnel scan on ${ctx.businessName} — I wanted to personally walk you through what we found."

KEY DATA POINTS:
- Overall score: ${ctx.overallHealth}/100
- Weakest area: ${ctx.weakLabel} (${ctx.weakScore}/100)
${findings.map((f) => `- Critical finding: ${f.title}`).join('\n')}

OPENING QUESTION: "Before I dive in — what's your #1 marketing challenge right now?"

TRANSITION TO FINDINGS: "Great — that actually connects to what our scan found. Your ${ctx.weakLabel} scored ${ctx.weakScore} out of 100, which means..."

${ctx.topCritical ? `LEAD INSIGHT: "${ctx.topCritical.title}" — ${ctx.topCritical.detail}` : ''}`;
}

// ============================================================
// Helpers
// ============================================================

function findTopCriticalFinding(scanResult: ScanResult): StageFinding | null {
  // Find the highest-impact critical finding across all stages
  const criticals = scanResult.stages
    .flatMap((s) => s.summary?.findings ?? [])
    .filter((f) => f.type === 'critical');

  // Prefer high-impact first
  const highImpact = criticals.find((f) => f.impact === 'high');
  if (highImpact) return highImpact;

  return criticals[0] ?? null;
}

function findWeakestStage(scanResult: ScanResult) {
  return scanResult.stages
    .filter((s) => s.summary && s.status === 'completed')
    .sort((a, b) => (a.summary?.score ?? 100) - (b.summary?.score ?? 100))[0] ?? null;
}

function calculateOverallHealth(scan: ScanResult): number {
  const weights: Record<FunnelStage, number> = {
    traffic: 0.15, landing: 0.30, capture: 0.25, offer: 0.20, followup: 0.10,
  };
  let weightedSum = 0;
  let totalWeight = 0;
  for (const stage of scan.stages) {
    if (stage.summary && stage.status === 'completed') {
      const weight = weights[stage.stage];
      weightedSum += stage.summary.score * weight;
      totalWeight += weight;
    }
  }
  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}
