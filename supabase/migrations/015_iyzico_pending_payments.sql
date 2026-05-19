-- Migration 015: Iyzico ödeme idempotency + audit log tablosu
-- Iyzico checkout flow: createReportPackCheckout server action insert eder (status=pending),
-- /api/webhooks/iyzico callback'i status=completed/failed yapar. Aynı conversation_id
-- iki kez işlenmez (idempotent).

create table if not exists public.iyzico_pending_payments (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id text not null,
  report_count integer not null,
  price_try numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  iyzico_payment_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists iyzico_pending_user_idx on public.iyzico_pending_payments (user_id, created_at desc);
create index if not exists iyzico_pending_status_idx on public.iyzico_pending_payments (status) where status = 'pending';

comment on table public.iyzico_pending_payments is 'Iyzico ödeme akışı idempotency + audit. Pending → completed/failed. Webhook tarafından güncellenir.';
comment on column public.iyzico_pending_payments.conversation_id is 'Iyzico conversationId — checkout init sırasında üretilen UUID. Callback eşleştirme key.';
comment on column public.iyzico_pending_payments.pack_id is 'REPORT_PACK.id — şu anda hep "pack3" (3 rapor). Gelecekte farklı paketler için.';
comment on column public.iyzico_pending_payments.report_count is 'Bu ödemenin kullanıcıya eklediği ek rapor sayısı (subscriptions.extra_tokens += bu).';
comment on column public.iyzico_pending_payments.iyzico_payment_id is 'Iyzico tarafının paymentId değeri — refund/dispute için lazım.';
