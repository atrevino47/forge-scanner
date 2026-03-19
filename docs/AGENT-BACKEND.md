# AGENT-BACKEND — Backend Agent Instructions

> Read `CLAUDE.md` first, then this file.

## Your role
You own all server-side infrastructure: database, API routes, authentication, screenshot pipeline, follow-up system, payments, webhooks, cron jobs, and rate limiting.

## Your directories
```
/supabase/migrations/              # Database migrations
/supabase/seed.sql                 # Seed data
/src/app/api/                      # ALL API route handlers
/src/lib/db/                       # Supabase client, queries, types
/src/lib/auth/                     # Auth config, middleware, guards
/src/lib/screenshots/              # Browserless.io client, capture pipeline
/src/lib/followup/                 # Email (Resend), SMS (Twilio), WhatsApp sending logic
/src/lib/stripe/                   # Stripe client, payment intents, webhooks
/src/lib/rate-limit/               # IP + email rate limiting
/src/middleware.ts                  # Next.js middleware
/next.config.ts                    # Next.js config
```

## DO NOT TOUCH
- `/src/components/` (Frontend)
- `/src/app/(pages)/` (Frontend)
- `/src/lib/ai/` (AI Engine)
- `/src/lib/prompts/` (AI Engine)
- `/src/lib/scanner/` (AI Engine)
- `/src/lib/blueprint/` (AI Engine)
- `/contracts/` (Orchestrator only)

## Build order

### Phase 1: Foundation (Week 1)

**1. Supabase schema migration**
Create full schema from `FORGE-FUNNEL-SCANNER-SPEC.md` Section 15.2. All tables, indexes, RLS policies.
```bash
npx supabase migration new initial_schema
```

Tables: leads, users, scans, funnel_stages, screenshots, blueprints, conversations, messages, followups, bookings, payments, rate_limits.

**2. Supabase Auth**
- Enable Google OAuth provider
- Configure redirect URLs for audit.forgedigital.com
- Auth is OPTIONAL (for saving results, not gating anything)

**3. API route stubs**
Create all routes with Zod validation, returning mock data:
```
POST   /api/scan/start
GET    /api/scan/status/[id]     (SSE)
POST   /api/scan/capture-info
GET    /api/scan/results/[id]
POST   /api/blueprint/generate/[scanId]
GET    /api/auth/callback
POST   /api/auth/link-scan
POST   /api/chat/start/[scanId]
POST   /api/chat/message
GET    /api/chat/stream/[convId] (SSE)
POST   /api/followup/trigger
POST   /api/followup/scrape-contact
POST   /api/followup/webhook/sms
POST   /api/followup/webhook/whatsapp
POST   /api/followup/webhook/calcom
POST   /api/payments/create-intent
POST   /api/payments/webhook
GET    /api/payments/verify
GET    /api/admin/leads
GET    /api/admin/dashboard
GET    /api/admin/scan/[id]
CRUD   /api/admin/team
POST   /api/cron/followup-sender
POST   /api/cron/nurture-sender
POST   /api/cron/stale-scans
GET    /api/health
```

### Phase 2: Screenshot Pipeline (Week 2)

**4. Browserless.io integration**
```typescript
// /src/lib/screenshots/client.ts
// Connect to Browserless.io via Playwright over WebSocket
import { chromium } from 'playwright';

export async function connectBrowser() {
  return chromium.connectOverCDP(
    `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`
  );
}
```

**5. Capture pipeline**
`/src/lib/screenshots/pipeline.ts` — the complete capture flow:
1. Capture homepage (desktop + mobile)
2. Detect and capture inner pages (max 5)
3. Auto-detect social links from website HTML
4. Capture social profile pages
5. Detect GBP (Google Places API)
6. Capture GBP listing
7. Check Meta Ad Library + Google Ads Transparency
8. Upload all screenshots to Supabase Storage
9. Return screenshot metadata for AI annotation

**6. SSE streaming endpoint**
`/api/scan/status/[id]` — critical path:
- Opens SSE connection
- Polls `funnel_stages` and `screenshots` tables for status changes
- Pushes events matching `contracts/events.ts` types
- Auto-closes when all 5 stages complete
- Handles client disconnect
- Single connection per scan_id

### Phase 3: Integration + Payments (Week 3)

**7. Wire scan pipeline to API**
- `POST /api/scan/start` creates lead + scan + dispatches screenshot pipeline
- Pipeline updates DB as captures happen → SSE picks up changes
- After captures complete, call AI Engine functions for annotation

**8. Stripe integration**
- Team-initiated payments only (not self-serve)
- `POST /api/payments/create-intent` creates Stripe PaymentIntent
- `POST /api/payments/webhook` handles payment confirmation
- Admin route serves Stripe Elements for in-call payment

**9. Cal.com webhook**
- `POST /api/followup/webhook/calcom` receives booking events
- Creates booking record in DB
- Links to lead and scan
- Stops all follow-up sequences for this lead

### Phase 4: Follow-up System (Week 4)

**10. Multi-channel follow-up**
- Resend for email (with AI-generated content from AI Engine)
- Twilio for SMS
- WhatsApp Business API for WhatsApp
- All messages stored in `messages` table with channel tracking

**11. Contact scraping**
- `POST /api/followup/scrape-contact` — extract email/phone from the lead's website, GBP, WHOIS
- Only triggered when lead leaves without providing contact info

**12. Cron jobs (Vercel Cron)**
```
POST /api/cron/followup-sender    — every minute (process pending follow-ups)
POST /api/cron/nurture-sender     — daily (long-term nurture emails)
POST /api/cron/stale-scans        — hourly (clean up abandoned scans)
```

**13. Rate limiting**
- 3 scans per IP per 24h
- 1 scan per email
- 60 API requests per minute per IP
- 1 SSE connection per scan_id

## Input validation
Use Zod for ALL API inputs. Import request types from `/contracts/api.ts` as reference for the schema shape.

## Error response format
```typescript
{
  error: {
    code: string;       // 'RATE_LIMITED', 'INVALID_INPUT', 'NOT_FOUND'
    message: string;    // user-friendly
    details?: unknown;  // dev only
  }
}
```

## Environment variables you need
```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BROWSERLESS_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
WHATSAPP_API_TOKEN
WHATSAPP_PHONE_NUMBER_ID
CALCOM_API_KEY
CALCOM_WEBHOOK_SECRET
GOOGLE_PAGESPEED_API_KEY
GOOGLE_PLACES_API_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL
```

## Receiving Fix Tickets

When Adrián gives you a fix ticket path (e.g., `docs/fixes/FIX-0001.md`):

1. Read the ticket file completely
2. Read the file(s) listed in "File(s) to modify"
3. Apply ONLY the change described — no refactoring, no "while I'm here" improvements
4. Do NOT modify files outside your owned directories
5. Do NOT modify the fix ticket itself (it is Orchestrator-owned)
6. Do NOT modify `docs/fixes/FIX-LOG.md` (it is Orchestrator-owned)
7. After applying the fix, confirm to Adrián what you changed
8. The Orchestrator will run verification separately
