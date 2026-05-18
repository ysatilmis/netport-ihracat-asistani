import { createServiceClient } from '@/lib/supabase/server'
import { checkMarketSignal } from '@/lib/market-signal'

export const maxDuration = 300

interface ReportRow {
  id: string
  user_id: string
  input_json: { product?: string; country?: string } | null
  last_signal_check_at: string | null
}

interface PreviousSignalRow {
  current_snapshot: string | null
}

const BATCH_LIMIT = 20
const STALE_DAYS = 5 // 5 gün geçtiyse yeniden kontrol et

export async function POST(request: Request) {
  // Vercel Cron Bearer auth — manuel tetikleme için de geçerli
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = await createServiceClient()
  const url = new URL(request.url)
  const force = url.searchParams.get('force') === '1'

  // 90 gün içinde oluşturulmuş tam raporlar; en eski "last_signal_check_at"
  // olanlar önce işlensin (NULL = hiç kontrol edilmemiş → en önce).
  const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reports, error: rErr } = await (supabase.from('reports') as any)
    .select('id, user_id, input_json, last_signal_check_at')
    .eq('is_full_report', true)
    .gte('created_at', cutoff)
    .order('last_signal_check_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_LIMIT)

  if (rErr) {
    console.error('[cron/market-signals] reports query error:', rErr)
    return Response.json(
      {
        ok: false,
        stage: 'reports_query',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (rErr as any).message ?? JSON.stringify(rErr),
        hint:
          'last_signal_check_at kolonu yoksa migration 007_report_signals.sql Supabase Studio\'da çalıştırılmalı.',
      },
      { status: 500 },
    )
  }

  const list = (reports ?? []) as ReportRow[]
  const staleCutoff = Date.now() - STALE_DAYS * 24 * 3600 * 1000

  let processed = 0
  let signalsCreated = 0
  let skipped = 0
  const log: Array<{ id: string; result: string }> = []

  for (const r of list) {
    const product = r.input_json?.product?.trim()
    const country = r.input_json?.country?.trim()
    if (!product || !country) {
      skipped++
      log.push({ id: r.id, result: 'skip-missing-input' })
      continue
    }

    // Son kontrolden bu yana STALE_DAYS dolmadıysa atla (force=1 ile bypass)
    if (!force && r.last_signal_check_at) {
      const last = new Date(r.last_signal_check_at).getTime()
      if (last > staleCutoff) {
        skipped++
        log.push({ id: r.id, result: 'skip-fresh' })
        continue
      }
    }

    // En son snapshot'ı al
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prev } = await (supabase.from('report_signals') as any)
      .select('current_snapshot')
      .eq('report_id', r.id)
      .order('detected_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const prevSnapshot = (prev as PreviousSignalRow | null)?.current_snapshot ?? ''

    const result = await checkMarketSignal(product, country, prevSnapshot)

    if (!result) {
      log.push({ id: r.id, result: 'llm-fail' })
      processed++
      continue
    }

    if (result.hasChange) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('report_signals') as any).insert({
        user_id: r.user_id,
        report_id: r.id,
        signal_type: result.signalType,
        severity: result.severity,
        summary: result.summary,
        detail: result.detail,
        current_snapshot: result.currentSnapshot,
        previous_snapshot: prevSnapshot,
      })
      signalsCreated++
      log.push({ id: r.id, result: `signal:${result.signalType}:sev${result.severity}` })
    } else if (!prevSnapshot) {
      // Baseline — has_change=false ama ilk snapshot'ı kaydet ki bir sonraki
      // tarama bunu referans alabilsin. severity=1, is_resolved=true.
      // current_snapshot LLM'den boş gelse bile fallback yaz.
      const snapshot =
        result.currentSnapshot ||
        `${product} → ${country} pazarı için ${new Date()
          .toISOString()
          .slice(0, 10)} tarihinde baseline tarama tamamlandı. Belirgin değişim tespit edilmedi.`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('report_signals') as any).insert({
        user_id: r.user_id,
        report_id: r.id,
        signal_type: 'baseline',
        severity: 1,
        summary: 'İlk pazar tarama snapshotu kaydedildi',
        detail: '',
        current_snapshot: snapshot,
        previous_snapshot: '',
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      })
      log.push({ id: r.id, result: 'baseline' })
    } else {
      log.push({ id: r.id, result: 'no-change' })
    }

    // last_signal_check_at güncelle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('reports') as any)
      .update({ last_signal_check_at: new Date().toISOString() })
      .eq('id', r.id)

    processed++
  }

  console.log('[cron/market-signals] done', { processed, signalsCreated, skipped })

  return Response.json({
    ok: true,
    processed,
    signalsCreated,
    skipped,
    batchLimit: BATCH_LIMIT,
    log,
  })
}

// Vercel Cron GET ile tetikler, bizim de GET-friendly olalım
export async function GET(request: Request) {
  return POST(request)
}
