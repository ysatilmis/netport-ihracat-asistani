-- Migration 017: Fix handle_new_subscription trigger to include all required columns
-- Problem: trigger only set user_id and credits; other NOT NULL columns were missing
-- causing new user subscription rows to fail or be incomplete.

create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (
    user_id,
    plan,
    monthly_limit_tokens,
    current_period_start,
    current_period_end,
    extra_tokens,
    credits,
    stripe_customer_id,
    stripe_subscription_id
  )
  values (
    new.id,
    'free',
    0,
    current_date,
    current_date + interval '30 days',
    0,
    1,
    null,
    null
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
