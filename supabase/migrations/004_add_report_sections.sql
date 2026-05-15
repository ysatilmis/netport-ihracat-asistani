alter table public.reports
  add column if not exists report_sections jsonb,
  add column if not exists is_full_report boolean default false;
