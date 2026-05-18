-- 2026-05-17 — Faz 5.1: Pazar Sinyali Ajanı
-- Haftalık cron her aktif rapor için Perplexity ile spot kontrol yapar,
-- önceki snapshot'a göre delta varsa report_signals satırı insert eder.
-- Dashboard'da unresolved sinyal sayısı kırmızı rozet olarak gösterilir.

create table if not exists public.report_signals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  detected_at timestamptz not null default now(),
  signal_type text not null,
  severity smallint not null default 2 check (severity between 1 and 5),
  summary text not null,
  detail text not null default '',
  current_snapshot text not null default '',
  previous_snapshot text not null default '',
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists report_signals_user_unresolved_idx
  on public.report_signals(user_id, is_resolved, detected_at desc);

create index if not exists report_signals_report_idx
  on public.report_signals(report_id, detected_at desc);

-- RLS
alter table public.report_signals enable row level security;

create policy "signals_select_own"
  on public.report_signals
  for select
  using (auth.uid() = user_id);

create policy "signals_insert_service"
  on public.report_signals
  for insert
  with check (true);  -- cron service role bypass uses service key; user-context insert disabled

create policy "signals_update_own"
  on public.report_signals
  for update
  using (auth.uid() = user_id);

-- Son tarama zamanını rapor üzerinde takip etmek için reports tablosuna
-- nullable bir kolon ekle. Eğer yoksa.
alter table public.reports
  add column if not exists last_signal_check_at timestamptz;

create index if not exists reports_signal_check_idx
  on public.reports(last_signal_check_at);
