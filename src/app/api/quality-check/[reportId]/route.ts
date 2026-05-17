import { createClient, createServiceClient } from '@/lib/supabase/server'
import { runQualityCheck } from '@/lib/quality-check'
import { recordTokenUsage } from '@/lib/token'

// Hobby tier hard-clamp = 60s; chunk paralel ile total <40s hedefleniyor.
export const maxDuration = 60

interface ReportSection {
  title?: string
  text?: string
  phase?: number
}

interface RouteContext {
  params: Promise<{ reportId: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const { reportId } = await params

  // Auth: kullanıcı kendi raporunu denetleyebilir; veya service token bypass.
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  const isService = secret && auth === `Bearer ${secret}`

  const supabase = isService ? await createServiceClient() : await createClient()
  let userId: string | null = null

  if (!isService) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })
    userId = user.id
  }

  // Raporu çek
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase.from('reports') as any)
    .select('id, user_id, is_full_report, input_json, report_sections')
    .eq('id', reportId)
    .single()

  if (!report) {
    return Response.json({ ok: false, error: 'report not found' }, { status: 404 })
  }

  if (!isService && report.user_id !== userId) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  if (!report.is_full_report || !report.report_sections) {
    return Response.json({ ok: false, error: 'report is not a full report' }, { status: 400 })
  }

  const product = String(report.input_json?.product ?? '').trim()
  const country = String(report.input_json?.country ?? '').trim()
  if (!product || !country) {
    return Response.json({ ok: false, error: 'missing product/country' }, { status: 400 })
  }

  const sectionsMap = report.report_sections as Record<string, ReportSection>
  const sections = Object.entries(sectionsMap)
    .filter(([, s]) => s && typeof s.text === 'string' && s.text.length > 50)
    .map(([key, s]) => ({
      key,
      title: String(s.title ?? key),
      text: String(s.text),
    }))

  if (sections.length === 0) {
    return Response.json({ ok: false, error: 'no sections to analyze' }, { status: 400 })
  }

  // status=running yaz
  const ownerId = report.user_id as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('quality_checks') as any)
    .upsert(
      {
        user_id: ownerId,
        report_id: reportId,
        status: 'running',
        error_message: null,
      },
      { onConflict: 'report_id' },
    )

  const result = await runQualityCheck(product, country, sections)

  if (!result) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('quality_checks') as any)
      .upsert(
        {
          user_id: ownerId,
          report_id: reportId,
          status: 'failed',
          error_message: 'LLM çağrısı başarısız oldu',
        },
        { onConflict: 'report_id' },
      )
    return Response.json({ ok: false, error: 'llm-failed' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('quality_checks') as any)
    .upsert(
      {
        user_id: ownerId,
        report_id: reportId,
        overall_score: result.overallScore,
        flags_json: result.flags,
        summary: result.summary,
        tokens_used: result.tokensUsed,
        status: 'done',
        error_message: null,
      },
      { onConflict: 'report_id' },
    )

  void recordTokenUsage(ownerId, 4, 'quality_check', result.tokensUsed, 'claude-haiku-4-5')

  return Response.json({
    ok: true,
    overallScore: result.overallScore,
    summary: result.summary,
    flagCount: result.flags.length,
    tokensUsed: result.tokensUsed,
  })
}
