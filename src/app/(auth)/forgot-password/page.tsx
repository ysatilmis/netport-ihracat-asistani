'use client'
import { requestPasswordReset } from '@/actions/auth'
import Link from 'next/link'
import { useActionState } from 'react'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  if (state?.success) {
    return (
      <div className="w-full text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
          Mail gönderildi
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
          Şifre sıfırlama linki gönderildi.
        </h2>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6">
          <span className="text-3xl">📧</span>
        </div>
        <p className="text-slate-600 text-sm sm:text-base mb-2 max-w-md mx-auto leading-relaxed">
          E-posta adresine bir şifre sıfırlama linki gönderdik.
        </p>
        <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Mail gelmezse spam klasörünü kontrol et. Link 1 saat geçerlidir.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Giriş sayfasına dön
          <span aria-hidden>→</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
        Şifre sıfırla
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
        Şifreni mi unuttun?
      </h2>
      <p className="text-slate-500 text-sm sm:text-base mb-8">
        E-posta adresini gir, sana sıfırlama linki gönderelim.
      </p>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ornek@firma.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {pending ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Şifreni hatırladın mı?{' '}
          <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
            Giriş yap
          </Link>
        </p>
      </form>
    </div>
  )
}
