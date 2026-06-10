import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FeedbackForm } from './feedback-form'

export const metadata: Metadata = {
  title: 'Geri Bildirim — Netport İhracat Asistanı',
}

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('full_name').eq('id', user.id).single()
    : { data: null }

  return (
    <main className="max-w-xl mx-auto px-4 py-10 w-full">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-mono text-slate-600 mb-4 shadow-sm">
          <span aria-hidden>💬</span>
          <span>Geri Bildirim</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Görüşlerinizi paylaşın
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Varsayılan olarak formunuz <strong>anonim</strong> işlenir.
          Geri dönüş almak isterseniz bilgilerinizi paylaşabilirsiniz.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <FeedbackForm
          defaultName={profile?.full_name ?? ''}
          defaultEmail={user?.email ?? ''}
        />
      </div>
    </main>
  )
}
