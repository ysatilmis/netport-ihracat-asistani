-- Migration 010: kullanıcının kendi raporunu silebilmesi için RLS DELETE policy.
-- Child tablolar (positioning_packages, report_signals, report_leads, quality_checks)
-- zaten ON DELETE CASCADE ile bağlı, ek policy gerekmez.

create policy "reports_delete_own"
  on public.reports for delete
  using (auth.uid() = user_id);
