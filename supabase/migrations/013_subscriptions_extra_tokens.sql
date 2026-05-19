-- Migration 013: Tek seferlik token paketi alımları için extra_tokens sütunu.
-- Kullanıcı Stripe one-time price ile token paketi alınca bu sütun artırılır.
-- getMonthlyUsage limit = monthly_limit_tokens + extra_tokens.

alter table public.subscriptions
  add column if not exists extra_tokens integer not null default 0;
