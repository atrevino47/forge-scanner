// /src/lib/prompts/industry-detector.ts
// Infers industry + customer-role + typical avg-ticket from scraped site content.
// Runs ONCE per scan, ahead of annotation. Cached on the scan record.
// Feeds {{industry}} / {{customer_role}} / {{avg_ticket_usd_range}} template slots
// to downstream prompts (annotation, stage-summary, funnel-map, blueprint-diagram,
// teaser-finding, sales-agent-system). Low-confidence detection (<0.6) falls
// back to generic "your industry" copy in consumers.

const SYSTEM_PROMPT = `You are an industry classifier for service-business websites in the $500K–$5M annual revenue band.

Your job: read the scraped site content (title, meta, H1, hero copy, nav labels, service list, about text) and infer:

1. The industry (as a slug + display name)
2. The customer's role/identity (singular and plural — "homeowner/homeowners", "patient/patients", "client/clients", "couple/couples")
3. The typical average-ticket USD range for this industry at this revenue band
4. A confidence score 0–1 (0 = pure guess, 1 = unambiguous)
5. 1–5 short evidence phrases quoted directly from the scraped content

Rules:
- Use the most specific slug that is still honest. "hvac-contracting" > "home-services" if the site is clearly HVAC. If the site is ambiguous, prefer broader slugs.
- NEVER default to med-spa or any other specific industry when unsure — output a generic slug like "professional-services" or "local-service-business" and mark confidence ≤0.5.
- Customer role MUST be a human role the business serves (not the business itself). Roofing contractor → "homeowner". Med spa → "patient". Wedding planner → "couple". B2B agency → "operator" or "founder".
- Avg-ticket range is the typical SINGLE transaction or initial engagement value at this revenue band, not LTV. Roofing: $8k–$25k. Med-spa: $300–$3k. Agency retainer: $3k–$15k/mo. HVAC service call: $200–$8k. Use your training-data knowledge honestly; round to round numbers.
- Evidence quotes must be VERBATIM strings present in the scraped content you were given. Do not paraphrase.
- If scraped content is empty or near-empty, return confidence 0.1 with industry_slug "generic" and evidence ["no-content-available"].`;

const JSON_SCHEMA = `Return ONLY valid JSON matching this exact schema:
{
  "industry_slug": "lowercase-kebab-case-slug",
  "industry_display": "Human-readable industry name, 2-60 chars",
  "confidence": 0.0 to 1.0,
  "customer_role_singular": "homeowner | patient | client | couple | etc.",
  "customer_role_plural": "homeowners | patients | clients | couples | etc.",
  "typical_avg_ticket_usd": {
    "min": integer >= 1,
    "max": integer >= min
  },
  "evidence": ["verbatim phrase 1", "verbatim phrase 2", ...] // 1-5 quoted strings
}`;

export function getIndustryDetectorPrompt(scrapedContent: {
  title?: string;
  metaDescription?: string;
  h1?: string;
  heroCopy?: string;
  navLabels?: string[];
  serviceList?: string[];
  aboutText?: string;
  url: string;
}): string {
  const parts: string[] = [];
  parts.push(`URL: ${scrapedContent.url}`);
  if (scrapedContent.title) parts.push(`TITLE: ${scrapedContent.title}`);
  if (scrapedContent.metaDescription) parts.push(`META DESCRIPTION: ${scrapedContent.metaDescription}`);
  if (scrapedContent.h1) parts.push(`H1: ${scrapedContent.h1}`);
  if (scrapedContent.heroCopy) parts.push(`HERO COPY:\n${scrapedContent.heroCopy.slice(0, 1200)}`);
  if (scrapedContent.navLabels?.length) parts.push(`NAV LABELS: ${scrapedContent.navLabels.join(' | ')}`);
  if (scrapedContent.serviceList?.length) parts.push(`SERVICES LISTED: ${scrapedContent.serviceList.slice(0, 20).join(' | ')}`);
  if (scrapedContent.aboutText) parts.push(`ABOUT TEXT:\n${scrapedContent.aboutText.slice(0, 1500)}`);

  const scrapedBlock = parts.join('\n\n') || '(no content available)';

  return `${SYSTEM_PROMPT}

SCRAPED CONTENT:

${scrapedBlock}

${JSON_SCHEMA}`;
}
