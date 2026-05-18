-- 2026-05-16 — Pilot aşaması: token sınırı pratikte sınırsız.
-- Ticari lansmanla birlikte bu migration revert edilir veya
-- monthly_limit_tokens yeniden 5000 (free) / paid plan değerlerine ayarlanır.

alter table subscriptions
  alter column monthly_limit_tokens set default 10000000;

update subscriptions
   set monthly_limit_tokens = 10000000
 where monthly_limit_tokens = 5000;
