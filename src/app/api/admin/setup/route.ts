import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';

interface EnvCheckResult {
  key: string;
  label: string;
  status: 'ok' | 'missing' | 'warning';
  hint: string;
}

interface SetupResponse {
  checks: EnvCheckResult[];
  allOk: boolean;
}

function check(key: string, label: string, hint: string, warnValue?: string): EnvCheckResult {
  const val = process.env[key];
  if (!val) return { key, label, status: 'missing', hint };
  if (warnValue && val === warnValue) return { key, label, status: 'warning', hint };
  return { key, label, status: 'ok', hint };
}

export async function GET(request: NextRequest): Promise<NextResponse<SetupResponse | { error: { code: string; message: string } }>> {
  const authError = await requireAdminSession(request);
  if (authError) return authError as NextResponse<{ error: { code: string; message: string } }>;

  const checks: EnvCheckResult[] = [
    check('NEXT_PUBLIC_SUPABASE_URL', 'Supabase URL', 'Set NEXT_PUBLIC_SUPABASE_URL to your project URL'),
    check('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon Key', 'Set NEXT_PUBLIC_SUPABASE_ANON_KEY from project settings'),
    check('SUPABASE_SERVICE_ROLE_KEY', 'Supabase Service Role Key', 'Set SUPABASE_SERVICE_ROLE_KEY for server-side operations'),
    check('ANTHROPIC_API_KEY', 'Anthropic API Key', 'Set ANTHROPIC_API_KEY from console.anthropic.com'),
    check('BROWSERLESS_API_KEY', 'Browserless API Key', 'Set BROWSERLESS_API_KEY from browserless.io'),
    check('RESEND_API_KEY', 'Resend API Key', 'Set RESEND_API_KEY from resend.com for email delivery'),
    check('NEXT_PUBLIC_APP_URL', 'App URL', 'Change from localhost to your production URL before going live', 'http://localhost:3000'),
    check('STRIPE_SECRET_KEY', 'Stripe Secret Key', 'Set STRIPE_SECRET_KEY for payment processing'),
    check('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'Stripe Publishable Key', 'Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    check('STRIPE_WEBHOOK_SECRET', 'Stripe Webhook Secret', "Set STRIPE_WEBHOOK_SECRET — webhooks won't verify without it"),
    check('NEXT_PUBLIC_CALCOM_EMBED_URL', 'Cal.com Embed URL', 'Set NEXT_PUBLIC_CALCOM_EMBED_URL for booking modal'),
    check('CALCOM_API_KEY', 'Cal.com API Key', 'Set CALCOM_API_KEY for calendar integration'),
    check('GOOGLE_PAGESPEED_API_KEY', 'Google PageSpeed API Key', 'Set GOOGLE_PAGESPEED_API_KEY for performance scoring'),
    check('GOOGLE_PLACES_API_KEY', 'Google Places API Key', 'Set GOOGLE_PLACES_API_KEY for GBP detection'),
    check('NEXT_PUBLIC_POSTHOG_KEY', 'PostHog Key', 'Set NEXT_PUBLIC_POSTHOG_KEY for analytics'),
    check('TWILIO_ACCOUNT_SID', 'Twilio Account SID', 'Set TWILIO_ACCOUNT_SID for SMS follow-ups (optional for demo)'),
    check('TWILIO_AUTH_TOKEN', 'Twilio Auth Token', 'Set TWILIO_AUTH_TOKEN for SMS follow-ups (optional for demo)'),
    check('TWILIO_PHONE_NUMBER', 'Twilio Phone Number', 'Set TWILIO_PHONE_NUMBER for SMS sending (optional for demo)'),
  ];

  const allOk = checks.every(c => c.status === 'ok' || c.status === 'warning');

  return NextResponse.json({ checks, allOk });
}
