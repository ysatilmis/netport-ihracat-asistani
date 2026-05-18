import { createClient, createServiceClient } from '@/lib/supabase/server'
import { findLeads } from '@/lib/lead-finder'
import { recordTokenUsage } from '@/lib/token'

export const maxDuration = 60

interface RouteContext {
  params: Promise<{ reportId: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  const { reportId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('report_leads') as any)
    .select('id, report_id, leads_json, status, error_message, tokens_used, model, updated_at')
    .eq('user_id', user.id)
    .eq('report_id', reportId)
    .maybeSingle()

  return Response.json({ ok: true, data })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { reportId } = await params

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase.from('reports') as any)
    .select('id, user_id, input_json')
    .eq('id', reportId)
    .single()

  if (!report) {
    return Response.json({ ok: false, error: 'report not found' }, { status: 404 })
  }

  if (!isService && report.user_id !== userId) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const product = String(report.input_json?.product ?? '').trim()
  const country = String(report.input_json?.country ?? '').trim()

  if (!product || !country) {
    return Response.json({ ok: false, error: 'missing product/country' }, { status: 400 })
  }

  const ownerId = report.user_id as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('report_leads') as any).upsert(
    { user_id: ownerId, report_id: reportId, status: 'running', error_message: null },
    { onConflict: 'report_id' },
  )

  const result = await findLeads(product, country, 20)

  if (!result) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('report_leads') as any).upsert(
      { user_id: ownerId, report_id: reportId, status: 'failed', error_message: 'LLM çağrısı başarısız oldu' },
      { onConflict: 'report_id' },
    )
    return Response.json({ ok: false, error: 'llm-failed' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('report_leads') as any).upsert(
    {
      user_id: ownerId,
      report_id: reportId,
      leads_json: result.leads,
      tokens_used: result.tokensUsed,
      model: 'perplexity/sonar-pro',
      status: 'done',
      error_message: null,
    },
    { onConflict: 'report_id' },
  )

  void recordTokenUsage(ownerId, 4, 'lead_finder', result.tokensUsed, 'perplexity/sonar-pro')

  return Response.json({
    ok: true,
    leadCount: result.leads.length,
    tokensUsed: result.tokensUsed,
  })
}
