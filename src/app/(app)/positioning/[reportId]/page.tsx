import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PositioningClient } from '@/components/positioning-client'

interface PageProps {
  params: Promise<{ reportId: string }>
}

export default async function PositioningPage({ params }: PageProps) {
  const { reportId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // Rapor bilgisini al (product + country için)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report } = await (supabase.from('reports') as any)
    .select('id, user_id, input_json')
    .eq('id', reportId)
    .single()

  if (!report || report.user_id !== user.id) return notFound()

  const product = String(report.input_json?.product ?? '').trim()
  const country = String(report.input_json?.country ?? '').trim()

  if (!product || !country) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-3">Faz B çalıştırılamıyor</h1>
        <p className="text-slate-600">
          Bu rapor henüz tam değil (ürün veya ülke bilgisi yok). Önce Faz A&apos;yı
          tamamlayın.
        </p>
        <Link
          href={`/results/${reportId}`}
          className="inline-block mt-4 text-sm underline text-slate-700"
        >
          ← Rapora dön
        </Link>
      </div>
    )
  }

  // Var olan paketi getir (varsa)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingPkg } = await (supabase.from('positioning_packages') as any)
    .select('id, target_language, usp_text, personas_json, product_description, cold_email, is_complete')
    .eq('report_id', reportId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="max-w-5xl">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400"
      >
        <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
          Dashboard
        </Link>
        <span aria-hidden>/</span>
        <Link href="/results" className="hover:text-slate-700 transition-colors">
          Raporlarım
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/results/${reportId}`}
          className="hover:text-slate-700 transition-colors truncate max-w-[16rem]"
        >
          {product} → {country}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-slate-900 font-semibold">Faz B</span>
      </nav>

      <PositioningClient
        reportId={reportId}
        product={product}
        country={country}
        initialPackage={existingPkg ?? null}
      />
    </div>
  )
}
