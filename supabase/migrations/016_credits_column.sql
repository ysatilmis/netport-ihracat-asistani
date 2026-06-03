-- Migration 016: Credit-based rapor sistemi
-- credits = kullanıcının kalan rapor kredisi.
-- Yeni kullanıcı: trigger ile 1 kredi başlar.
-- Rapor üretimi: api/report/route.ts tarafından 1 azaltılır.
-- Paket alımı: iyzico webhook tarafından artırılır.
-- Admin override: admin.ts / updateUserCredits ile set edilir.

alter table public.subscriptions
  add column if not exists credits integer not null default 1;

-- Backfill: mevcut kullanıcılar için kredileri hesapla.
-- Mantık: extra_tokens > 0 ise o değeri al, yoksa 1 ver.
-- (Mevcut kullanıcılar zaten test aşamasında, 1 kredi yeterli.)
update public.subscriptions
  set credits = greatest(1, coalesce(extra_tokens, 0))
  where credits = 1;

-- Yeni kullanıcı trigger'ını güncelle: credits = 1 ile başlasın.
create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, credits)
  values (new.id, 1);
  return new;
end;
$$;

-- Atomic decrement RPC — report route bu fonksiyonu çağırır.
-- Returns updated credits value. If credits <= 0, raises exception.
create or replace function public.decrement_credits(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_credits integer;
begin
  select credits into v_credits
    from public.subscriptions
    where user_id = p_user_id
    for update;

  if v_credits is null then
    raise exception 'SUBSCRIPTION_NOT_FOUND';
  end if;

  if v_credits <= 0 then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.subscriptions
    set credits = credits - 1
    where user_id = p_user_id;

  return v_credits - 1;
end;
$$;

-- Atomic increment RPC for Iyzico webhook
create or replace function public.increment_credits(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.subscriptions
    set credits = credits + p_amount
    where user_id = p_user_id;

  if not found then
    raise exception 'SUBSCRIPTION_NOT_FOUND';
  end if;
end;
$$;
