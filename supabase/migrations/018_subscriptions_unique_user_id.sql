-- Migration 018: Unique constraint on subscriptions.user_id
-- Prevents duplicate subscription rows per user (bootstrap bug, race conditions).
-- The handle_new_subscription trigger already uses ON CONFLICT (user_id) — this
-- migration adds the actual constraint that ON CONFLICT needs to work.

-- Step 1: Remove duplicate rows (keep the one with highest credits, then newest)
delete from public.subscriptions a
using public.subscriptions b
where a.user_id = b.user_id
  and (
    a.credits < b.credits
    or (a.credits = b.credits and a.current_period_start < b.current_period_start)
    or (a.credits = b.credits and a.current_period_start = b.current_period_start and a.id < b.id)
  );

-- Step 2: Add unique constraint
alter table public.subscriptions
  add constraint subscriptions_user_id_unique unique (user_id);