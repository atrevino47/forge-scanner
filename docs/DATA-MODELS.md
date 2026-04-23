---
title: Data Models
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# Data Models

Everything the scanner persists. Postgres is the system of record; Supabase Storage is the blob tier; `contracts/` is the TypeScript mirror.

## Source files

- **Migrations (append-only):** `supabase/migrations/*.sql`
- **DB row types (snake_case):** `src/lib/db/types.ts`
- **Contract types (camelCase, shared with frontend):** `contracts/types.ts`
- **DB ↔ contract mappers:** `src/lib/db/mappers.ts`
- **Query helpers:** `src/lib/db/admin-queries.ts`, `src/lib/db/client.ts`
- **RLS policies:** inline in migrations

## ER diagram

```mermaid
erDiagram
  auth_users ||--o{ users : "id ref"
  leads ||--o{ scans : "1:N"
  leads ||--o{ conversations : "1:N"
  leads ||--o{ followups : "1:N"
  leads ||--o{ bookings : "1:N"
  leads ||--o{ payments : "1:N"
  leads ||--o{ users : "claimed via lead_id"

  auth_users ||--o{ scans : "user_id (optional)"
  scans ||--o{ funnel_stages : "1:5"
  scans ||--o{ screenshots : "1:N"
  scans ||--|| blueprints : "1:1"
  scans ||--o{ conversations : "1:N"
  scans ||--o{ followups : "0:N"
  scans ||--o{ bookings : "0:N"
  scans ||--o{ payments : "0:N"

  conversations ||--o{ messages : "1:N"

  auth_users ||--o{ workbook_submissions : "user_id (nullable)"

  rate_limits }|..|{ leads : "no FK — key-scoped"

  leads {
    uuid id PK
    text email
    text phone
    text full_name
    text website_url
    text business_name
    lead_source source
    capture_method capture_method
    timestamptz created_at
    timestamptz updated_at
  }
  scans {
    uuid id PK
    uuid lead_id FK
    uuid user_id FK "auth.users; nullable"
    text website_url
    scan_status status
    jsonb detected_socials
    jsonb provided_socials
    jsonb social_enrichment
    jsonb ad_detection
    text utm_source
    text utm_medium
    text utm_campaign
    timestamptz completed_at
    timestamptz created_at
  }
  funnel_stages {
    uuid id PK
    uuid scan_id FK
    funnel_stage stage
    stage_status status
    jsonb summary
    timestamptz started_at
    timestamptz completed_at
    timestamptz created_at
  }
  screenshots {
    uuid id PK
    uuid scan_id FK
    funnel_stage stage
    source_type source_type
    text source_url
    text storage_url
    viewport_type viewport
    jsonb annotations
    timestamptz analyzed_at
    timestamptz created_at
  }
  blueprints {
    uuid id PK
    uuid scan_id FK UK
    jsonb funnel_map
    text mockup_html
    text mockup_target
    jsonb brand_colors
    timestamptz created_at
  }
  conversations {
    uuid id PK
    uuid scan_id FK
    uuid lead_id FK
    conversation_status status
    int engagement_score
    int objection_count
    text last_objection_type
    timestamptz created_at
    timestamptz updated_at
  }
  messages {
    uuid id PK
    uuid conversation_id FK
    channel_type channel
    message_role role
    text content
    jsonb metadata
    timestamptz created_at
  }
  followups {
    uuid id PK
    uuid lead_id FK
    uuid scan_id FK
    channel_type channel
    followup_status status
    followup_reason reason
    text content
    timestamptz scheduled_at
    timestamptz sent_at
    text sequence_id
    int sequence_step
    timestamptz created_at
  }
  bookings {
    uuid id PK
    uuid lead_id FK
    uuid scan_id FK
    text cal_event_id
    timestamptz scheduled_at
    booking_status status
    booking_source source
    timestamptz created_at
  }
  payments {
    uuid id PK
    uuid lead_id FK
    uuid scan_id FK
    text stripe_payment_intent_id UK
    int amount_cents
    text currency
    payment_product_type product_type
    text description
    payment_status status
    timestamptz created_at
  }
  rate_limits {
    uuid id PK
    text key
    rate_limit_type type
    int count
    timestamptz window_start
    timestamptz created_at
  }
  users {
    uuid id PK "= auth.users.id"
    text email
    text full_name
    text avatar_url
    uuid lead_id FK
    text role
    timestamptz created_at
  }
  workbook_submissions {
    uuid id PK
    uuid user_id FK "auth.users; nullable (anon create then claim)"
    text type "branding | offers"
    text client_name
    text business_name
    text locale
    jsonb answers
    int completed_count
    int total_fields
    timestamptz created_at
    timestamptz updated_at
  }
```

## Enums

Defined in `20260318203853_initial_schema.sql` and mirrored 1:1 in `contracts/types.ts`. Changing an enum is a breaking change — add via migration and update contracts in the same PR.

| SQL enum | Values |
|---|---|
| `funnel_stage` | `traffic, landing, capture, offer, followup` |
| `scan_status` | `scanning, capturing, analyzing, completed, failed` |
| `stage_status` | `pending, capturing, analyzing, completed, failed` |
| `annotation_type` | `critical, warning, opportunity, positive` |
| `source_type` | `website, instagram, facebook, tiktok, linkedin, gbp, ads` |
| `viewport_type` | `desktop, mobile` |
| `channel_type` | `web, email, sms, whatsapp, voice` |
| `message_role` | `user, assistant, system` |
| `conversation_status` | `active, booked, declined, nurturing, expired` |
| `followup_status` | `pending, sent, delivered, opened, clicked, replied, failed` |
| `booking_status` | `scheduled, completed, cancelled, no-show` |
| `booking_source` | `banner_cta, ai_agent, results_cta, email_link, sms_link, whatsapp_link, voice_call` |
| `lead_source` | `organic, outreach, ad` |
| `capture_method` | `direct, scraped, manual` |
| `payment_status` | `pending, succeeded, failed, refunded` |
| `payment_product_type` | `setup_fee, monthly_retainer, custom_package` |
| `followup_reason` | `exit_intent, no_booking, abandoned_scan` |
| `rate_limit_type` | `ip_scan, email_scan, ip_api` |

## Table reference

### `leads`
Identity of a prospect. Created eagerly at `POST /api/scan/start` (even before email is captured) so the scan can reference it. `email` / `phone` / `full_name` populated via `POST /api/scan/capture-info` or scraped recovery.

Indexes: `email` (partial, WHERE email IS NOT NULL), `website_url`, `created_at DESC`, `source`.
`updated_at` maintained by `leads_updated_at` trigger.

### `scans`
One per scan kick-off. `status` progresses `scanning → capturing → analyzing → completed|failed`. `detected_socials` populated by `social-detector`, `provided_socials` by user form, `social_enrichment` from Apify, `ad_detection` from Meta Ad Library + Google Ads Transparency. `user_id` set only after a user signs in via the "save results" soft prompt (`/api/auth/link-scan`).

Indexes: `lead_id`, `user_id` (partial), `status`, `created_at DESC`.

### `funnel_stages`
Exactly 5 per scan (created eagerly or lazily by the pipeline). `summary` holds a `StageSummary` (exists, score, headline, findings[]). `unique (scan_id, stage)` enforces 1-row-per-stage.

### `screenshots`
The visual artifacts. `storage_url` is the **public** Supabase Storage URL (not a path — we store the full URL because the frontend needs it verbatim). `annotations` is the full `Annotation[]` array written in place when the AI finishes.

### `blueprints`
1:1 with `scans`. `funnel_map` = `FunnelMapData`, `mockup_html` = generated HTML snippet, `mockup_target` = which stage was mocked (e.g. `'landing'`). `brand_colors` is extracted from the homepage screenshot.

### `conversations`, `messages`
AI Sales Agent session + transcript. `conversations.status` transitions through `active → booked|declined|nurturing|expired`. `engagement_score` / `objection_count` / `last_objection_type` updated inline by the objection classifier during streaming. `messages.metadata` holds inline-widget references (`type: 'data_card' | 'calcom_embed' | 'screenshot_ref'`).

### `followups`
Scheduled outbound messages. `sequence_id` groups a 3-touch cadence; `sequence_step` increments as we send. Cron at `/api/cron/followup-sender` scans `WHERE status = 'pending' AND scheduled_at <= now()` every minute.

### `bookings`
Created on Cal.com `BOOKING_CREATED` webhook. `source` tracks attribution (banner_cta vs ai_agent vs results_cta). Booking cancels all pending follow-ups for the lead.

### `payments`
Team-initiated only. Created by `POST /api/payments/create-intent`, updated by Stripe webhook. `stripe_payment_intent_id` is unique for idempotency.

### `rate_limits`
Compound key: `(key, type)` unique. `key` can be an IP, an email, or any bucket. Incrementing is atomic via `UPDATE rate_limits SET count = count + 1`.

### `users`
Mirror of `auth.users` populated by `/api/auth/link-scan`. Holds Forge-specific fields (`role`, `lead_id` claim link).

### `workbook_submissions`
Branding + offers discovery workbooks. `user_id` is nullable — anonymous users can submit, and later "claim" the row by signing in (`user_id IS NULL` fallback allowed in UPDATE policy).

## Storage

One bucket: **`screenshots`** (public, 10 MB limit, PNG/JPEG/WebP only). Seeded in the initial migration.

Object keys follow `<scanId>/<stage>-<sourceType>-<viewport>-<uuid>.png`. Public read policy: anyone can `SELECT`. Only authenticated (service role through API routes) can `INSERT`.

## RLS model

| Table | `anon` read | `authenticated` read | Write |
|---|---|---|---|
| leads | — | own (via scans) | service-role |
| scans | ✅ (by id = bearer URL) | own | service-role |
| funnel_stages | ✅ | ✅ | service-role |
| screenshots | ✅ | ✅ | service-role |
| blueprints | ✅ | ✅ | service-role |
| conversations | — | own | service-role |
| messages | — | own (via conversations) | service-role |
| followups | — | — | service-role |
| bookings | — | own | service-role |
| payments | — | — | service-role |
| rate_limits | — | — | service-role |
| users | — | self | service-role + `/api/auth/link-scan` |
| workbook_submissions | — | own | INSERT anyone, UPDATE self-or-unclaimed |

Principle: the scan **URL** is itself a capability token (unguessable uuid) — so anonymous read of a scan by id is safe for the public-facing `/scan/:id` page. Anything that could leak other users' data (conversations, followups, payments, bookings, leads) is RLS-locked.

## Migrations

Append-only. Every file is `YYYYMMDDHHMMSS_<slug>.sql`. Never edit a previously-applied migration — write a new one.

Current migrations:

| File | Purpose |
|---|---|
| `20260318203853_initial_schema.sql` | 11 core tables + 17 enums + RLS + screenshots bucket |
| `20260327210000_conversation_tracking.sql` | engagement_score + objection tracking on conversations |
| `20260403140000_add_enrichment_columns.sql` | scans.social_enrichment + scans.ad_detection jsonb |
| `20260404230000_create_users_table.sql` | public.users mirror of auth.users |
| `20260416000000_create_workbook_submissions.sql` | initial workbook table |
| `20260416010000_workbook_add_user_id_rls.sql` | tightened RLS + user_id FK |
| `20260417120000_workbook_add_type.sql` | branding | offers discriminator |

### Adding a migration

```bash
bunx supabase migration new <slug>
# edit the generated file
bunx supabase db reset     # local replay + apply
# once happy
bunx supabase db push      # apply to remote
# update src/lib/db/types.ts + contracts/types.ts in the same PR
```

If the change affects contract types, do **contracts first**, then DB types, then queries / routes — so type errors cascade in the right direction.

## JSONB payloads

Several columns use JSONB with structured shape. These are not free-form — validate at write time.

| Column | Shape | Defined in |
|---|---|---|
| `scans.detected_socials` | `DetectedSocials` | `contracts/types.ts` |
| `scans.provided_socials` | `ProvidedSocials` | same |
| `scans.social_enrichment` | `SocialEnrichmentResult` | same |
| `scans.ad_detection` | `{ meta: AdDetectionResult \| null; google: GoogleAdsDetectionResult \| null }` | same |
| `funnel_stages.summary` | `StageSummary` | same |
| `screenshots.annotations` | `Annotation[]` | same |
| `blueprints.funnel_map` | `FunnelMapData` | same |
| `blueprints.brand_colors` | `{ primary, secondary, accent, background, text }` | same |
| `messages.metadata` | `{ type, screenshotId?, annotations?, calcomUrl? }` | same |

When reading, always narrow through a mapper (`src/lib/db/mappers.ts`) — never pass raw JSONB to the frontend.

## Related

- [API.md](API.md) — the endpoints that read/write these tables
- [ARCHITECTURE.md](ARCHITECTURE.md) — data flow between subsystems
- [AGENTS.md](AGENTS.md) — which agent owns which tables
