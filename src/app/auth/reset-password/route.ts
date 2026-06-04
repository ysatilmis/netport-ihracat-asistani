import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`)
    }
  }

  if (token && type === 'recovery') {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    })
    if (!error) {
      return NextResponse.redirect(`${origin}/reset-password`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
