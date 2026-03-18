// /src/lib/prompts/mockup.ts
// System prompt for generating a professional HTML/CSS mockup
// of the client's weakest funnel piece, redesigned for conversion

import type { FunnelStage, FunnelMapNode, StageFinding } from '@/../../contracts/types';

export interface MockupPromptParams {
  targetStage: FunnelStage;
  stageNode: FunnelMapNode;
  findings: StageFinding[];
  businessName: string;
  websiteUrl: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  industry?: string;
}

export function getMockupPrompt(params: MockupPromptParams): string {
  const {
    targetStage,
    stageNode,
    findings,
    businessName,
    websiteUrl,
    brandColors,
    industry,
  } = params;

  const stageContext = getMockupContext(targetStage);

  return `You are an elite web designer and conversion rate optimization expert. You specialize in creating high-converting landing pages and marketing assets that look like they cost $10,000+ to design.

TASK: Generate a complete, self-contained HTML page that serves as a professional mockup redesign of the weakest funnel piece for this business.

BUSINESS: ${businessName}
WEBSITE: ${websiteUrl}
${industry ? `INDUSTRY: ${industry}` : ''}
TARGET STAGE: ${targetStage.toUpperCase()} — ${stageNode.label}

CURRENT STATE:
${stageNode.currentDescription}

IDEAL STATE:
${stageNode.idealDescription}

IMPROVEMENTS TO IMPLEMENT:
${stageNode.improvements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

KEY FINDINGS FROM SCAN:
${findings.map((f) => `- [${f.type.toUpperCase()}] ${f.title}: ${f.detail}`).join('\n')}

BRAND COLORS:
- Primary: ${brandColors.primary}
- Secondary: ${brandColors.secondary}
- Accent: ${brandColors.accent}
- Background: ${brandColors.background}
- Text: ${brandColors.text}

${stageContext}

DESIGN REQUIREMENTS:
1. **Self-contained HTML** — All CSS must be inline or in a <style> tag. No external dependencies. No JavaScript required.
2. **Brand-aligned** — Use the provided brand colors consistently. The mockup should feel like it belongs to ${businessName}.
3. **Conversion-optimized** — Every element should serve the conversion goal. Clear visual hierarchy. Single primary CTA.
4. **Professional quality** — This should look like a real page from a premium agency. Clean typography, proper spacing, attention to detail.
5. **Responsive** — Use CSS that works on desktop (displayed in an iframe at ~800px width).
6. **Realistic content** — Use placeholder text that sounds like real copy for ${businessName}'s industry. Use [COPY: description] format for headlines and body text that the copywriter will refine.
7. **Modern design patterns** — Subtle gradients, proper shadow depths, rounded corners, ample whitespace. Think Linear/Stripe quality.

CONTENT SECTIONS (include all that apply to the stage):
${getSectionGuidance(targetStage)}

WATERMARK:
Include a subtle "Built by Forge" watermark in the bottom-right corner with this exact HTML:
<div style="position: fixed; bottom: 12px; right: 16px; font-size: 11px; color: rgba(255,255,255,0.3); font-family: system-ui, sans-serif; letter-spacing: 0.05em;">
  Built by <span style="color: #D4A537; font-weight: 600;">Forge</span>
</div>

RETURN FORMAT:
Return ONLY the complete HTML document. Start with <!DOCTYPE html> and end with </html>.
Do NOT wrap it in markdown code fences. Do NOT include any explanation before or after the HTML.
The HTML must be valid and render correctly in a modern browser.`;
}

function getMockupContext(stage: FunnelStage): string {
  const contexts: Record<FunnelStage, string> = {
    traffic: `MOCKUP TYPE: Social media profile optimization guide / ad creative concept
Design a visual guide showing the optimized version of their social profile or a sample ad creative.
Include: optimized bio text, strategic highlight covers, sample post layout, CTA placement.`,

    landing: `MOCKUP TYPE: Homepage / Landing Page Redesign
Design a full above-the-fold landing page section (hero) plus one or two supporting sections.
Include: compelling headline, sub-headline, primary CTA, trust signals, social proof element, navigation bar.
The hero section is the most critical — it determines if visitors stay or bounce.`,

    capture: `MOCKUP TYPE: Lead Capture Page / Opt-in Redesign
Design a high-converting lead capture section or dedicated squeeze page.
Include: lead magnet offer, benefit bullets, form with minimal fields, compelling CTA button, social proof, urgency element.
The form design and CTA copy are the most critical elements.`,

    offer: `MOCKUP TYPE: Pricing / Services Page Redesign
Design a clear, compelling pricing or services section.
Include: package/tier presentation, feature comparison, recommended tier highlight, risk reversal (guarantee), social proof, primary CTA per tier.
Clarity and value communication are the most critical elements.`,

    followup: `MOCKUP TYPE: Follow-up Email Template / Nurture Sequence Preview
Design a professional follow-up email template that references scan findings.
Include: personalized opening referencing their scan data, key insight, visual data snippet, clear CTA to book a call, unsubscribe footer.
Personalization and relevance are the most critical elements.`,
  };
  return contexts[stage];
}

function getSectionGuidance(stage: FunnelStage): string {
  const guidance: Record<FunnelStage, string> = {
    traffic: `- Profile header with optimized bio
- Strategic content grid layout
- Highlight/pinned content strategy
- CTA link in bio visualization
- Engagement metrics callout`,

    landing: `- Navigation bar (clean, minimal)
- Hero section with headline + sub-headline + CTA
- Trust bar (client logos or "as seen in")
- Benefits/features section (3-4 key points with icons)
- Social proof section (testimonial or stats)
- Secondary CTA section`,

    capture: `- Lead magnet hero (what they get)
- Benefit bullets (3-5 reasons to opt in)
- Opt-in form (name + email, maybe phone)
- CTA button with compelling text
- Social proof / trust signals
- Micro-copy reducing friction`,

    offer: `- Section headline communicating value
- 2-3 pricing tiers in a clear grid
- Feature list per tier with checkmarks
- Recommended tier highlight
- Guarantee / risk reversal badge
- FAQ section (2-3 common objections)
- Bottom CTA`,

    followup: `- Email header with brand logo
- Personalized greeting
- Key finding from their scan (with visual)
- Insight paragraph explaining impact
- CTA button to book strategy call
- PS line with urgency
- Footer with unsubscribe`,
  };
  return guidance[stage];
}
