'use client'
import { updatePassword } from '@/actions/auth'
import { useActionState } from 'react'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <div className="w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
        Yeni şifre
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
        Yeni şifreni belirle.
      </h2>
      <p className="text-slate-500 text-sm sm:text-base mb-8">
        En az 6 karakter olmalı.
      </p>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Yeni Şifre <span className="text-slate-400 font-normal">(min 6 karakter)</span>
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

        <div className="space-y-1.5">
          <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700">
            Şifre Tekrar
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
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
          {pending ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
        </button>
      </form>
    </div>
  )
}
