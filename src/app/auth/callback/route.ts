import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  // --- Flow 1: token_hash + type (direct verifyOtp, PKCE-free, cross-device safe) ---
  if (tokenHash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'recovery' | 'invite' | 'email_change',
    })

    if (error) {
      console.error('[auth/callback] verifyOtp failed:', error.message, { type })
      const fallback = type === 'recovery'
        ? '/reset-password?error=invalid_link'
        : '/login?error=auth_callback_error'
      return NextResponse.redirect(`${origin}${fallback}`)
    }

    // Recovery → şifre sıfırlama sayfasına yönlendir
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // Signup / invite → giriş sayfasına yönlendir
    return NextResponse.redirect(`${origin}${next ?? '/login?confirmed=1'}`)
  }

  // --- Flow 2: code (PKCE, fallback for old email links) ---
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }

    return NextResponse.redirect(`${origin}${next ?? '/login?confirmed=1'}`)
  }

  // --- No valid params ---
  console.error('[auth/callback] no token_hash, type, or code in URL')
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}