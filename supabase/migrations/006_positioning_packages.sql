-- 2026-05-17 — Faz B: Konumlandırma Paketleri
-- Bir rapor (Faz A → 10 bölüm) tamamlandıktan sonra kullanıcı "Faz B'ye geç"
-- diyerek hedef pazara özel USP + persona + çok-dilli ürün açıklaması + cold
-- email taslağı üretir. Bu çıktı kendi tablosunda saklanır.

create table if not exists public.positioning_packages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  product text not null,
  country text not null,
  target_language text not null,
  usp_text text not null default '',
  personas_json jsonb,
  product_description text not null default '',
  cold_email text not null default '',
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists positioning_packages_user_idx
  on public.positioning_packages(user_id, created_at desc);

create index if not exists positioning_packages_report_idx
  on public.positioning_packages(report_id);

-- RLS
alter table public.positioning_packages enable row level security;

create policy "positioning_select_own"
  on public.positioning_packages
  for select
  using (auth.uid() = user_id);

create policy "positioning_insert_own"
  on public.positioning_packages
  for insert
  with check (auth.uid() = user_id);

create policy "positioning_update_own"
  on public.positioning_packages
  for update
  using (auth.uid() = user_id);

create policy "positioning_delete_own"
  on public.positioning_packages
  for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists positioning_updated_at on public.positioning_packages;
create trigger positioning_updated_at
  before update on public.positioning_packages
  for each row
  execute function public.set_updated_at();
