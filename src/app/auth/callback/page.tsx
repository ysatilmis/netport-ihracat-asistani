'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/login?confirmed=1'

    if (!code) {
      setStatus('error')
      setErrorMsg('Onay kodu bulunamadı. Lütfen tekrar kayıt olmayı dene.')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
        setStatus('error')
        setErrorMsg('Onay bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar kayıt olmayı dene.')
      } else {
        setStatus('success')
        // Redirect after a brief moment so the user sees the success state
        setTimeout(() => router.push(next), 800)
      }
    })
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg border border-slate-100 text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-slate-900">E-posta onaylanıyor...</h2>
            <p className="mt-1 text-sm text-slate-500">Lütfen bekleyin, hesabınız aktifleştiriliyor.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">E-posta onaylandı!</h2>
            <p className="mt-1 text-sm text-slate-500">Giriş sayfasına yönlendiriliyorsunuz...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <span className="text-3xl">✗</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Onay başarısız</h2>
            <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
            <a
              href="/register"
              className="mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-px transition-all"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Tekrar kayıt ol
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg border border-slate-100 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-slate-900">Yükleniyor...</h2>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}