-- Migration 012: token_usage.phase constraint (1,2,3) → (0,1,2,3,4) genişletilir.
-- phase=0 full_report kayıtları için gerekli.

alter table public.token_usage
  drop constraint if exists token_usage_phase_check;

alter table public.token_usage
  add constraint token_usage_phase_check check (phase in (0, 1, 2, 3, 4));
