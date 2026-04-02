/**
 * Branded HTML email template for follow-up sequences.
 *
 * Wraps AI-generated email content in responsive Forge branding:
 * dark background, orange accents, clean typography.
 *
 * Compatible with all major email clients (Gmail, Apple Mail, Outlook).
 * Uses inline styles only — no external CSS.
 */

import type { SequencePosition } from '@/lib/prompts/email-followup';

interface EmailTemplateParams {
  /** AI-generated subject line */
  subject: string;
  /** AI-generated body text (supports **bold** markdown) */
  body: string;
  /** Which email in the 3-touch sequence */
  position: SequencePosition;
  /** Business name for personalization */
  businessName: string;
  /** Cal.com booking URL */
  calcomUrl: string;
  /** Lead's scan results URL */
  scanUrl?: string;
}

// ── Brand colors (matching design tokens) ──────────────

const C = {
  bg: '#141413',
  surface: '#1E1E1C',
  card: '#282826',
  accent: '#E8530E',
  accentBright: '#FF6B2B',
  text: '#F0EFE9',
  muted: '#9A9890',
  border: 'rgba(255,107,43,0.12)',
} as const;

// ── Position-specific CTA labels ───────────────────────

const CTA_LABELS: Record<SequencePosition, string> = {
  1: 'Book Your Free Strategy Call',
  2: 'Grab a Call Slot This Week',
  3: 'Last Chance — Book Before Results Expire',
};

// ── Markdown bold to HTML ──────────────────────────────

function markdownBoldToHtml(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${C.text};font-weight:700;">$1</strong>`);
}

// ── Body text to HTML paragraphs ───────────────────────

function bodyToHtml(body: string): string {
  return body
    .split('\n\n')
    .filter(Boolean)
    .map((paragraph) => {
      const html = markdownBoldToHtml(
        paragraph.replace(/\n/g, '<br/>'),
      );
      return `<p style="margin:0 0 16px 0;font-family:'Space Grotesk',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${C.muted};">${html}</p>`;
    })
    .join('');
}

// ── Main template ──────────────────────────────────────

export function renderFollowupEmail(params: EmailTemplateParams): string {
  const { body, position, businessName, calcomUrl, scanUrl } = params;
  const ctaLabel = CTA_LABELS[position];
  const bodyHtml = bodyToHtml(body);

  // Position-specific header accent
  const headerLabel =
    position === 1 ? 'Your Funnel Scan Results' :
    position === 2 ? 'A Quick Insight for You' :
    'Your Results Are Expiring Soon';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="dark"/>
<meta name="supported-color-schemes" content="dark"/>
<title>${params.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};-webkit-font-smoothing:antialiased;">

<!-- Preheader (hidden preview text) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  ${businessName} — ${headerLabel} &nbsp;&#8199;&#65279;&#847;
</div>

<!-- Wrapper table -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:40px 16px;">

  <!-- Content card -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${C.surface};border:1px solid ${C.border};border-radius:12px;">

    <!-- Orange top bar -->
    <tr><td style="height:4px;background-color:${C.accent};border-radius:12px 12px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Header -->
    <tr><td style="padding:32px 32px 0 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="font-family:system-ui,-apple-system,sans-serif;font-size:20px;font-weight:900;letter-spacing:-0.5px;color:${C.text};">FORGE</span>
            <span style="display:inline-block;margin-left:8px;background-color:rgba(232,83,14,0.15);color:${C.accent};font-family:ui-monospace,monospace;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:3px 8px;border-radius:4px;">
              ${headerLabel}
            </span>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:20px 32px 0 32px;">
      <div style="height:1px;background-color:${C.border};"></div>
    </td></tr>

    <!-- Body content -->
    <tr><td style="padding:24px 32px 0 32px;">
      ${bodyHtml}
    </td></tr>

    <!-- CTA Button -->
    <tr><td style="padding:8px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background-color:${C.accent};border-radius:8px;">
            <a href="${calcomUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:ui-monospace,monospace;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">
              ${ctaLabel}
            </a>
          </td>
        </tr>
      </table>
    </td></tr>

    ${scanUrl ? `
    <!-- View results link -->
    <tr><td style="padding:16px 32px 0 32px;text-align:center;">
      <a href="${scanUrl}" target="_blank" style="font-family:ui-monospace,monospace;font-size:11px;color:${C.accent};text-decoration:underline;letter-spacing:0.5px;">
        View your full scan results
      </a>
    </td></tr>
    ` : ''}

    <!-- Footer -->
    <tr><td style="padding:32px 32px 24px 32px;">
      <div style="height:1px;background-color:${C.border};margin-bottom:20px;"></div>
      <p style="margin:0;font-family:ui-monospace,monospace;font-size:10px;color:${C.muted};line-height:1.6;text-align:center;">
        forgewith.ai &mdash; AI-Powered Funnel Audits<br/>
        You received this because you scanned ${businessName}.<br/>
        <a href="{{{UNSUBSCRIBE_URL}}}" style="color:${C.accent};text-decoration:underline;">Unsubscribe</a>
      </p>
    </td></tr>

  </table>
  <!-- /Content card -->

</td></tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;
}
