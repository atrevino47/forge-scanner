// /src/lib/prompts/annotation.ts
// Screenshot annotation prompts — one per funnel stage
// Each returns structured JSON matching Annotation[] from contracts

import type { FunnelStage } from '@/../../contracts/types';

const STAGE_INSTRUCTIONS: Record<FunnelStage, string> = {
  traffic: `Analyze this screenshot of a social media profile, ad presence, or traffic-generating page. Look for:

**Bio & Profile Optimization**
- Does the bio clearly communicate the value proposition and drive action?
- Is there a link in bio, and does it go to a high-converting destination (not just homepage)?
- Profile picture quality — professional, recognizable, brand-aligned?
- Username clarity — easy to search and remember?

**Visual Quality & Consistency**
- Is the feed visually cohesive (color palette, style consistency)?
- Quality of thumbnails and cover images
- Highlight covers (Instagram) or pinned posts — are they strategic?

**Posting & Engagement Signals**
- Can you detect posting frequency from timestamps visible?
- Engagement levels visible (likes, comments, shares relative to followers)
- Are they responding to comments?

**CTA & Conversion Readiness**
- Is there a clear call-to-action visible?
- Are there story/reel highlights driving to offers?
- Any ad indicators (sponsored labels, boosted content)?

**Platform-Specific**
- Google Business Profile: hours, reviews, posts, Q&A, photos
- Facebook: page quality, reviews, cover CTA, about section
- LinkedIn: headline, about section, featured posts, recommendations`,

  landing: `Analyze this screenshot of a website landing page or homepage. Look for:

**First Impression (5-Second Test)**
- Can you tell what the business does within 5 seconds?
- Is the value proposition above the fold?
- Is the hero section compelling or generic?
- Does the headline speak to a specific pain point or outcome?

**CTA Clarity & Placement**
- Is there a primary CTA above the fold?
- Is the CTA text specific ("Get Your Free Audit") or generic ("Learn More")?
- CTA contrast — does it visually pop against the background?
- How many competing CTAs are visible?

**Trust Signals**
- Testimonials or reviews visible?
- Client logos or case studies?
- Certifications, awards, or credentials?
- Social proof numbers (clients served, results achieved)?

**Navigation & UX**
- Is the navigation clean and not overwhelming?
- Mobile responsiveness issues visible?
- Loading performance signals (broken images, layout shift)?
- Whitespace usage — cluttered or breathable?

**Visual Hierarchy**
- Clear content hierarchy guiding the eye?
- Font readability and sizing
- Image quality and relevance
- Brand consistency across elements`,

  capture: `Analyze this screenshot for lead capture and conversion elements. Look for:

**Form Analysis**
- How many form fields are visible? (Fewer = higher conversion)
- Are fields asking for necessary information only?
- Is there a lead magnet or value exchange ("Get the free guide")?
- Form placement — is it visible without scrolling?
- Multi-step form or single step?

**CTA Optimization**
- CTA button text — specific vs generic?
- CTA size, color, contrast against background?
- Are there multiple CTAs creating decision fatigue?
- Micro-copy under CTA reducing friction ("No credit card required")?

**Lead Capture Mechanisms**
- Email opt-in visible?
- SMS/phone capture?
- Chat widget or bot?
- Exit intent mechanisms?
- Pop-up or slide-in offers?

**Value Proposition at Point of Capture**
- Is it clear what they get by submitting?
- Privacy assurance visible?
- Expected timeline communicated ("Results in 24 hours")?

**Friction Points**
- Captcha or unnecessary verification?
- Required fields that seem optional?
- Confusing layout around the form?
- Too much text before the form?`,

  offer: `Analyze this screenshot of a pricing, services, or product page. Look for:

**Offer Clarity**
- Can you immediately understand what they sell?
- Is pricing visible and clear?
- Are packages/tiers well-differentiated?
- Is the recommended option highlighted?

**Value Communication**
- Features vs benefits — are they selling outcomes or features?
- ROI or results communicated?
- Before/after or comparison elements?
- Case study integration with pricing?

**Risk Reversal**
- Money-back guarantee visible?
- Free trial or freemium option?
- "Cancel anytime" messaging?
- Social proof adjacent to pricing?

**Urgency & Scarcity**
- Limited-time offers?
- Limited availability signals?
- Countdown timers (if present, are they authentic)?
- Seasonal or event-based urgency?

**Payment & Friction**
- Payment method icons visible?
- Security badges (SSL, trust seals)?
- Clear next steps after selection?
- Monthly vs annual toggle?

**Upsell & Cross-sell**
- Add-on services visible?
- Bundle savings highlighted?
- Comparison to competitor pricing?`,

  followup: `Analyze this page for follow-up, retention, and remarketing signals. Look for:

**Tracking & Retargeting**
- Meta Pixel / Facebook pixel indicators in page source or visible code
- Google Analytics / Google Tag Manager presence
- LinkedIn Insight Tag indicators
- TikTok pixel presence
- Other remarketing tags visible

**Email Marketing**
- Newsletter signup visible?
- Blog with email subscription?
- Content upgrade offers (PDF, guide, checklist)?
- Footer email capture?

**Content & Nurture**
- Blog or resource section?
- Content quality and recency (last post date)?
- Content variety (video, text, infographics)?
- Educational vs promotional content ratio?

**Review & Reputation**
- Links to review platforms (Google, Yelp, Trustpilot)?
- Review management signals?
- Testimonial freshness and specificity?
- Response to negative reviews?

**Retention Mechanisms**
- Loyalty program or membership visible?
- Referral program?
- Community (Facebook group, Discord, etc.)?
- Repeat purchase incentives?

**Technical Signals**
- Cookie consent banner (indicates tracking awareness)?
- Schema markup indicators?
- Sitemap presence?
- Page load optimization signals?`,
};

const SYSTEM_PROMPT_HEADER = `You are an expert digital marketing analyst specializing in conversion optimization and sales funnels. You have 15+ years of experience auditing websites for Fortune 500 companies and high-growth startups.

Your analysis must be SPECIFIC — reference actual elements you can see in the screenshot. Never give generic advice like "improve your headline." Instead, say exactly what's wrong and why it matters with data.

When placing annotations, use precise x/y coordinates (0-100%) that point to the actual element being discussed.`;

const JSON_SCHEMA = `Return ONLY valid JSON matching this exact schema:
{
  "annotations": [
    {
      "id": "unique-kebab-case-id",
      "position": { "x": <0-100>, "y": <0-100> },
      "type": "critical" | "warning" | "opportunity" | "positive",
      "title": "Short label (5-8 words max)",
      "detail": "Specific explanation referencing what you see. Include data points or benchmarks when possible. 2-3 sentences.",
      "category": "descriptive_snake_case_category"
    }
  ]
}

Position guidelines:
- x=0 is left edge, x=100 is right edge
- y=0 is top edge, y=100 is bottom edge
- Point to the CENTER of the element being discussed

Annotation type guidelines:
- "critical": Actively hurting conversions. Must fix. (red)
- "warning": Suboptimal, leaving money on the table. (yellow)
- "opportunity": Not present but should be. Missing element. (blue)
- "positive": Doing this well. Reinforce. (green)

Return 4-7 annotations per screenshot. Prioritize:
1. Critical issues first (things actively losing them money)
2. High-impact opportunities
3. Warnings about suboptimal elements
4. At least 1 positive finding (what they're doing right)

Category examples: "headline", "cta", "trust_signals", "navigation", "hero_section", "form_design", "social_proof", "value_proposition", "visual_hierarchy", "mobile_ux", "lead_magnet", "pricing_clarity", "risk_reversal", "retargeting", "content_strategy"`;

export function getAnnotationPrompt(
  stage: FunnelStage,
  businessContext?: string,
): string {
  return `${SYSTEM_PROMPT_HEADER}

STAGE: ${stage.toUpperCase()} — ${getStageLabel(stage)}

${STAGE_INSTRUCTIONS[stage]}

${businessContext ? `BUSINESS CONTEXT:\n${businessContext}\nUse this context to make your analysis more specific and relevant.` : ''}

${JSON_SCHEMA}`;
}

function getStageLabel(stage: FunnelStage): string {
  const labels: Record<FunnelStage, string> = {
    traffic: 'Traffic Sources & Audience Building',
    landing: 'Landing Experience & First Impression',
    capture: 'Lead Capture & Conversion Points',
    offer: 'Offer & Pricing Presentation',
    followup: 'Follow-up, Retention & Remarketing',
  };
  return labels[stage];
}
