-- ============================================================
-- WORKBOOK: add type column — distinguish branding vs offers workbooks
-- ============================================================

alter table workbook_submissions
  add column type text not null default 'branding';

-- Constrain to known values (extensible later)
alter table workbook_submissions
  add constraint workbook_submissions_type_check
  check (type in ('branding', 'offers'));

create index idx_workbook_type on workbook_submissions (type);

-- Composite index for the common mine() lookup: (user_id, type, locale)
create index idx_workbook_user_type_locale
  on workbook_submissions (user_id, type, locale)
  where user_id is not null;
