-- 2026-05-17 — Faz 5.2: Kalite Kontrol Ajanı
-- Yeni bir rapor tamamlandığında veya manuel tetiklenince DeepSeek V4 Pro
-- rapor metnini denetler: kanıtsız iddia, çelişki, belirsiz veri, eksik kaynak.
-- Genel skor + flag listesi quality_checks tablosunda saklanır.

-- 006'da tanımlanması gereken function — emniyet için burada da idempotent
-- olarak tanımlıyoruz. Önceden varsa override edilir.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.quality_checks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  overall_score numeric(3, 1) not null default 0 check (overall_score >= 0 and overall_score <= 10),
  flags_json jsonb not null default '[]'::jsonb,
  summary text not null default '',
  model text not null default 'deepseek/deepseek-v4-pro',
  tokens_used int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists quality_checks_report_unique
  on public.quality_checks(report_id);

create index if not exists quality_checks_user_idx
  on public.quality_checks(user_id, created_at desc);

-- updated_at trigger (zaten 006'da set_updated_at function tanımlı)
drop trigger if exists quality_checks_updated_at on public.quality_checks;
create trigger quality_checks_updated_at
  before update on public.quality_checks
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.quality_checks enable row level security;

create policy "quality_select_own"
  on public.quality_checks
  for select
  using (auth.uid() = user_id);

create policy "quality_insert_own"
  on public.quality_checks
  for insert
  with check (auth.uid() = user_id);

create policy "quality_update_own"
  on public.quality_checks
  for update
  using (auth.uid() = user_id);

create policy "quality_delete_own"
  on public.quality_checks
  for delete
  using (auth.uid() = user_id);
