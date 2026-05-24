'use client'
import { adminSignIn } from './actions'
import { useActionState } from 'react'
import Image from 'next/image'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminSignIn, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <Image
              src="/netport-logo.png"
              alt="Netport"
              width={200}
              height={200}
              unoptimized
              className="h-12 w-auto object-contain mx-auto"
            />
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider bg-[var(--accent-strong)] text-white mb-4">
            Admin Panel
          </span>
          <h1 className="text-xl font-bold text-white">Yönetici Girişi</h1>
          <p className="text-sm text-slate-400 mt-2">
            Sadece yetkili admin hesapları girebilir.
          </p>
        </div>

        <form action={action} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Admin Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              placeholder="admin@netport.com.tr"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {pending ? 'Kontrol ediliyor...' : 'Admin Girişi'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          <a href="/login" className="hover:text-slate-300 transition-colors">
            ← Normal girişe dön
          </a>
        </p>
      </div>
    </div>
  )
}
