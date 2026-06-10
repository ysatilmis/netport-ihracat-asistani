import type { Metadata } from 'next'
import { FeedbackForm } from './feedback-form'

export const metadata: Metadata = {
  title: 'Geri Bildirim — Netport İhracat Asistanı',
}

export default function FeedbackPage() {
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
          Gönderdiğiniz form <strong>anonim</strong> olarak işlenir — kimlik bilgisi saklanmaz.
          Ürünü geliştirmemize yardımcı olan her geri bildirim değerlidir.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <FeedbackForm />
      </div>
    </main>
  )
}
