-- Migration 011: subscriptions tablosuna eksik Stripe sütunları eklenir.
-- Webhook kodu bu sütunları kullanıyor ama migration'da yoktu.

alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;
