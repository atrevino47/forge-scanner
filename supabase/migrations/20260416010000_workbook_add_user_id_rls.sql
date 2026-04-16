-- ============================================================
-- WORKBOOK: add user_id + tighten RLS
-- ============================================================

-- Add user ownership column
alter table workbook_submissions
  add column user_id uuid references auth.users(id);

create index idx_workbook_user_id on workbook_submissions (user_id)
  where user_id is not null;

-- Drop the overly permissive seed policies
drop policy if exists "Anyone can insert workbook submissions" on workbook_submissions;
drop policy if exists "Anyone can update their own submission" on workbook_submissions;
drop policy if exists "Service role can read all" on workbook_submissions;

-- INSERT: anyone (API route handles validation; service-role bypasses anyway)
create policy "workbook_insert"
  on workbook_submissions for insert
  with check (true);

-- SELECT: authenticated users see only their own rows
create policy "workbook_select_own"
  on workbook_submissions for select
  using (user_id = auth.uid());

-- UPDATE: authenticated users update only their own rows,
-- OR claim an unclaimed (anonymous) row by setting user_id
create policy "workbook_update_own"
  on workbook_submissions for update
  using (user_id = auth.uid() OR user_id IS NULL);

-- DELETE: nobody through the client — admin uses service role
-- (no policy = denied by default with RLS enabled)
