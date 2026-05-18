-- 2026-05-17 — Faz 5.3: Lead Bul Ajanı
-- Perplexity sonar-pro ile B2B alıcı firmalar bulunur ve report_leads tablosunda saklanır.

create table if not exists public.report_leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  leads_json jsonb not null default '[]'::jsonb,
  model text not null default 'perplexity/sonar-pro',
  tokens_used int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists report_leads_report_unique
  on public.report_leads(report_id);

create index if not exists report_leads_user_idx
  on public.report_leads(user_id, created_at desc);

drop trigger if exists report_leads_updated_at on public.report_leads;
create trigger report_leads_updated_at
  before update on public.report_leads
  for each row
  execute function public.set_updated_at();

alter table public.report_leads enable row level security;

create policy "leads_select_own"
  on public.report_leads
  for select
  using (auth.uid() = user_id);

create policy "leads_insert_own"
  on public.report_leads
  for insert
  with check (auth.uid() = user_id);

create policy "leads_update_own"
  on public.report_leads
  for update
  using (auth.uid() = user_id);

create policy "leads_delete_own"
  on public.report_leads
  for delete
  using (auth.uid() = user_id);
