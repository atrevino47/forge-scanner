-- ============================================================
-- FORGE FUNNEL SCANNER — Initial Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- ============================================================
-- ENUMS
-- ============================================================

create type funnel_stage as enum ('traffic', 'landing', 'capture', 'offer', 'followup');
create type scan_status as enum ('scanning', 'capturing', 'analyzing', 'completed', 'failed');
create type stage_status as enum ('pending', 'capturing', 'analyzing', 'completed', 'failed');
create type annotation_type as enum ('critical', 'warning', 'opportunity', 'positive');
create type source_type as enum ('website', 'instagram', 'facebook', 'tiktok', 'linkedin', 'gbp', 'ads');
create type viewport_type as enum ('desktop', 'mobile');
create type channel_type as enum ('web', 'email', 'sms', 'whatsapp', 'voice');
create type message_role as enum ('user', 'assistant', 'system');
create type conversation_status as enum ('active', 'booked', 'declined', 'nurturing', 'expired');
create type followup_status as enum ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed');
create type booking_status as enum ('scheduled', 'completed', 'cancelled', 'no-show');
create type booking_source as enum ('banner_cta', 'ai_agent', 'results_cta', 'email_link', 'sms_link', 'whatsapp_link', 'voice_call');
create type lead_source as enum ('organic', 'outreach', 'ad');
create type capture_method as enum ('direct', 'scraped', 'manual');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type payment_product_type as enum ('setup_fee', 'monthly_retainer', 'custom_package');
create type followup_reason as enum ('exit_intent', 'no_booking', 'abandoned_scan');
create type rate_limit_type as enum ('ip_scan', 'email_scan', 'ip_api');

-- ============================================================
-- LEADS
-- ============================================================

create table leads (
  id uuid primary key default extensions.uuid_generate_v4(),
  email text,
  phone text,
  full_name text,
  website_url text not null,
  business_name text,
  source lead_source not null default 'organic',
  capture_method capture_method,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_email on leads (email) where email is not null;
create index idx_leads_website_url on leads (website_url);
create index idx_leads_created_at on leads (created_at desc);
create index idx_leads_source on leads (source);

-- ============================================================
-- SCANS
-- ============================================================

create table scans (
  id uuid primary key default extensions.uuid_generate_v4(),
  lead_id uuid not null references leads (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  website_url text not null,
  status scan_status not null default 'scanning',
  detected_socials jsonb not null default '{}',
  provided_socials jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_scans_lead_id on scans (lead_id);
create index idx_scans_user_id on scans (user_id) where user_id is not null;
create index idx_scans_status on scans (status);
create index idx_scans_created_at on scans (created_at desc);

-- ============================================================
-- FUNNEL STAGES
-- ============================================================

create table funnel_stages (
  id uuid primary key default extensions.uuid_generate_v4(),
  scan_id uuid not null references scans (id) on delete cascade,
  stage funnel_stage not null,
  status stage_status not null default 'pending',
  summary jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (scan_id, stage)
);

create index idx_funnel_stages_scan_id on funnel_stages (scan_id);
create index idx_funnel_stages_status on funnel_stages (status);

-- ============================================================
-- SCREENSHOTS
-- ============================================================

create table screenshots (
  id uuid primary key default extensions.uuid_generate_v4(),
  scan_id uuid not null references scans (id) on delete cascade,
  stage funnel_stage not null,
  source_type source_type not null,
  source_url text not null,
  storage_url text not null,
  viewport viewport_type not null,
  annotations jsonb not null default '[]',
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_screenshots_scan_id on screenshots (scan_id);
create index idx_screenshots_stage on screenshots (stage);

-- ============================================================
-- BLUEPRINTS
-- ============================================================

create table blueprints (
  id uuid primary key default extensions.uuid_generate_v4(),
  scan_id uuid not null references scans (id) on delete cascade,
  funnel_map jsonb not null,
  mockup_html text not null,
  mockup_target text not null,
  brand_colors jsonb not null,
  created_at timestamptz not null default now(),
  unique (scan_id)
);

create index idx_blueprints_scan_id on blueprints (scan_id);

-- ============================================================
-- CONVERSATIONS (AI Sales Agent)
-- ============================================================

create table conversations (
  id uuid primary key default extensions.uuid_generate_v4(),
  scan_id uuid not null references scans (id) on delete cascade,
  lead_id uuid not null references leads (id) on delete cascade,
  status conversation_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_scan_id on conversations (scan_id);
create index idx_conversations_lead_id on conversations (lead_id);
create index idx_conversations_status on conversations (status);

-- ============================================================
-- MESSAGES
-- ============================================================

create table messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  channel channel_type not null default 'web',
  role message_role not null,
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_messages_conversation_id on messages (conversation_id);
create index idx_messages_created_at on messages (created_at);

-- ============================================================
-- FOLLOWUPS
-- ============================================================

create table followups (
  id uuid primary key default extensions.uuid_generate_v4(),
  lead_id uuid not null references leads (id) on delete cascade,
  scan_id uuid references scans (id) on delete set null,
  channel channel_type not null,
  status followup_status not null default 'pending',
  reason followup_reason not null,
  content text,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  sequence_id text not null,
  sequence_step integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_followups_lead_id on followups (lead_id);
create index idx_followups_status on followups (status);
create index idx_followups_scheduled_at on followups (scheduled_at) where status = 'pending';
create index idx_followups_sequence_id on followups (sequence_id);

-- ============================================================
-- BOOKINGS
-- ============================================================

create table bookings (
  id uuid primary key default extensions.uuid_generate_v4(),
  lead_id uuid not null references leads (id) on delete cascade,
  scan_id uuid references scans (id) on delete set null,
  cal_event_id text,
  scheduled_at timestamptz not null,
  status booking_status not null default 'scheduled',
  source booking_source not null,
  created_at timestamptz not null default now()
);

create index idx_bookings_lead_id on bookings (lead_id);
create index idx_bookings_status on bookings (status);
create index idx_bookings_scheduled_at on bookings (scheduled_at);

-- ============================================================
-- PAYMENTS
-- ============================================================

create table payments (
  id uuid primary key default extensions.uuid_generate_v4(),
  lead_id uuid not null references leads (id) on delete cascade,
  scan_id uuid references scans (id) on delete set null,
  stripe_payment_intent_id text not null unique,
  amount_cents integer not null,
  currency text not null default 'usd',
  product_type payment_product_type not null,
  description text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_payments_lead_id on payments (lead_id);
create index idx_payments_status on payments (status);
create index idx_payments_stripe_id on payments (stripe_payment_intent_id);

-- ============================================================
-- RATE LIMITS
-- ============================================================

create table rate_limits (
  id uuid primary key default extensions.uuid_generate_v4(),
  key text not null,
  type rate_limit_type not null,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (key, type)
);

create index idx_rate_limits_key_type on rate_limits (key, type);
create index idx_rate_limits_window_start on rate_limits (window_start);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

create trigger conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table leads enable row level security;
alter table scans enable row level security;
alter table funnel_stages enable row level security;
alter table screenshots enable row level security;
alter table blueprints enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table followups enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table rate_limits enable row level security;

-- Service role bypasses RLS. These policies cover anon + authenticated access.

-- Leads: users can read their own leads (via scans they own)
create policy "Users can read own leads"
  on leads for select
  to authenticated
  using (
    id in (select lead_id from scans where user_id = auth.uid())
  );

-- Scans: users can read their own scans
create policy "Users can read own scans"
  on scans for select
  to authenticated
  using (user_id = auth.uid());

-- Scans: anonymous can read by scan ID (for results page before auth)
create policy "Anon can read scans"
  on scans for select
  to anon
  using (true);

-- Funnel stages: readable by anyone (public results page)
create policy "Anon can read funnel stages"
  on funnel_stages for select
  to anon, authenticated
  using (true);

-- Screenshots: readable by anyone (public results page)
create policy "Anon can read screenshots"
  on screenshots for select
  to anon, authenticated
  using (true);

-- Blueprints: readable by anyone (public results page)
create policy "Anon can read blueprints"
  on blueprints for select
  to anon, authenticated
  using (true);

-- Conversations: users can read their own
create policy "Users can read own conversations"
  on conversations for select
  to authenticated
  using (
    lead_id in (select lead_id from scans where user_id = auth.uid())
  );

-- Messages: users can read messages from their conversations
create policy "Users can read own messages"
  on messages for select
  to authenticated
  using (
    conversation_id in (
      select id from conversations
      where lead_id in (select lead_id from scans where user_id = auth.uid())
    )
  );

-- Bookings: users can read their own
create policy "Users can read own bookings"
  on bookings for select
  to authenticated
  using (
    lead_id in (select lead_id from scans where user_id = auth.uid())
  );

-- Rate limits, followups, payments: service role only (no public RLS policies)

-- ============================================================
-- STORAGE BUCKET FOR SCREENSHOTS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  true,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Public read access for screenshot bucket
create policy "Public read access for screenshots"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'screenshots');

-- Service role uploads screenshots via API routes
create policy "Service role upload screenshots"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'screenshots');
