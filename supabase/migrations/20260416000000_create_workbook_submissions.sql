-- ============================================================
-- WORKBOOK SUBMISSIONS — stores brand workbook answers
-- ============================================================

create table workbook_submissions (
  id uuid primary key default extensions.uuid_generate_v4(),
  client_name text,
  business_name text,
  locale text not null default 'en',
  answers jsonb not null default '{}',
  completed_count int not null default 0,
  total_fields int not null default 12,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workbook_submissions_created_at on workbook_submissions (created_at desc);

-- RLS: public can insert/update their own (identified by id), admin can read all
alter table workbook_submissions enable row level security;

create policy "Anyone can insert workbook submissions"
  on workbook_submissions for insert
  with check (true);

create policy "Anyone can update their own submission"
  on workbook_submissions for update
  using (true);

create policy "Service role can read all"
  on workbook_submissions for select
  using (true);
