'use client'
import { signIn, resendConfirmation } from '@/actions/auth'
import Link from 'next/link'
import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ResendForm() {
  const [state, action, pending] = useActionState(resendConfirmation, undefined)

  if (state?.success) {
    return (
      <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 font-medium">
        Onay maili tekrar gönderildi. Lütfen mail kutunuzu kontrol edin.
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
      <p className="font-semibold mb-3">Onay bağlantısının süresi dolmuş.</p>
      <form action={action} className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="E-posta adresiniz"
          className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all whitespace-nowrap"
        >
          {pending ? 'Gönderiliyor...' : 'Yeniden Gönder'}
        </button>
      </form>
      {state?.error && (
        <p className="mt-2 text-xs text-red-600">{state.error}</p>
      )}
    </div>
  )
}

function LoginAlerts() {
  const searchParams = useSearchParams()
  const confirmed = searchParams.get('confirmed') === '1'
  const callbackError = searchParams.get('error') === 'auth_callback_error'

  if (confirmed) {
    return (
      <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 font-medium">
        E-posta adresin onaylandı. Artık giriş yapabilirsin.
      </div>
    )
  }
  if (callbackError) {
    return <ResendForm />
  }
  return null
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined)

  return (
    <div className="w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
        Hoş geldin
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
        Hesabına gir.
      </h2>
      <p className="text-slate-500 text-sm sm:text-base mb-8">
        İhracat raporlarına devam et veya yeni biri başlat.
      </p>

      <Suspense fallback={null}>
        <LoginAlerts />
      </Suspense>

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
            placeholder="ornek@netport.com.tr"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Şifre
            </label>
            <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline">
              Şifremi unuttum
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
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
          {pending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>

        <div className="relative my-6 text-center text-xs uppercase tracking-wider text-slate-400">
          <span className="bg-white px-3 relative z-10">veya</span>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200" aria-hidden />
        </div>

        <p className="text-center text-sm text-slate-500">
          Hesabın yok mu?{' '}
          <Link href="/register" className="font-medium text-[var(--primary)] hover:underline">
            Ücretsiz kayıt ol
          </Link>
        </p>
      </form>
    </div>
  )
}
