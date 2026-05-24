'use client'
import { signUp } from '@/actions/auth'
import Link from 'next/link'
import { useActionState } from 'react'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signUp, undefined)

  // Show confirmation notice after successful signup
  if (state?.success) {
    return (
      <div className="w-full text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
          Neredeyse tamam
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
          Mail adresini kontrol et.
        </h2>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6">
          <span className="text-3xl">📧</span>
        </div>
        <p className="text-slate-600 text-sm sm:text-base mb-2 max-w-md mx-auto leading-relaxed">
          <strong className="text-slate-900">{state.email}</strong> adresine bir onay maili gönderdik.
        </p>
        <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          Mail adresini onayladıktan sonra giriş yapabilirsin. Mail gelmediyse spam klasörünü kontrol et.
        </p>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-8 max-w-md mx-auto text-left">
          <p className="text-sm text-amber-800 font-medium mb-1">Onay maili gelmedi mi?</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>Spam / gereksiz e-posta klasörünü kontrol et</li>
            <li>Birkaç dakika bekle — bazen gecikebilir</li>
            <li>Hâlâ gelmediyse tekrar kayıt olmayı dene</li>
          </ul>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Giriş sayfasına git
          <span aria-hidden>→</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
        Hesap aç
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
        Ücretsiz başla.
      </h2>
      <p className="text-slate-500 text-sm sm:text-base mb-8">
        Free planla 2 rapor / ay. Kart bilgisi gerekmez.
      </p>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-700">
            Ad Soyad
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            placeholder="Adınız Soyadınız"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

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

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Şifre <span className="text-slate-400 font-normal">(min 6 karakter)</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

        {state?.error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {state.error.includes('zaten') ? (
              <span>
                {state.error.split('Lütfen')[0]}
                <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline ml-1">
                  Giriş yap
                </Link>
                <span> veya şifrenizi sıfırlayın.</span>
              </span>
            ) : (
              state.error
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {pending ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
            Giriş yap
          </Link>
        </p>
      </form>
    </div>
  )
}
