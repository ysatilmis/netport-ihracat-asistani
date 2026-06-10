'use server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateAuthInput(email: unknown, password: unknown, fullName?: unknown): string | null {
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return 'Geçerli bir e-posta adresi girin.'
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return 'Şifre en az 6 karakter olmalı.'
  }
  if (fullName !== undefined && (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2)) {
    return 'Ad soyad en az 2 karakter olmalı.'
  }
  return null
}

function sanitizeError(message: string): string {
  if (message.includes('Email not confirmed')) {
    return 'Email adresiniz henüz onaylanmamış. Lütfen mail kutunuzu kontrol edin ve onay linkine tıklayın.'
  }
  if (message.includes('Invalid login credentials') || message.includes('invalid')) {
    return 'Email veya şifre hatalı. Lütfen tekrar deneyin.'
  }
  if (message.includes('already registered') || message.includes('already exists') || message.includes('unique')) {
    return 'Bu email ile zaten bir hesap oluşturulmuş. Lütfen giriş yapın veya şifrenizi sıfırlayın.'
  }
  // Generic fallback — don't leak raw Supabase messages
  return 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  const validationError = validateAuthInput(email, password)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email as string,
    password: password as string,
  })
  if (error) {
    return { error: sanitizeError(error.message) }
  }
  redirect('/dashboard')
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')
  const fullName = formData.get('full_name')

  const validationError = validateAuthInput(email, password, fullName)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: email as string,
    password: password as string,
    options: {
      data: { full_name: fullName as string },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://netportai.com'}/auth/callback`,
    },
  })

  if (error) {
    return { error: sanitizeError(error.message) }
  }

  // Guarantee subscription row with 1 free credit regardless of DB trigger state.
  // Uses select-then-insert/update instead of upsert(onConflict) because
  // the unique constraint on user_id (migration 018) may not be applied yet.
  if (data.user?.id) {
    try {
      const service = await createServiceClient()
      // Ensure public.users row exists first (FK dependency for subscriptions)
      await service.from('users').upsert(
        { id: data.user.id, email: email as string, full_name: (fullName as string) || '', role: 'user' as const, product_name: null, target_country: null },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      // Check if subscription row already exists (from DB trigger or previous attempt)
      const { data: existingSub } = await service
        .from('subscriptions')
        .select('id, credits')
        .eq('user_id', data.user.id)
        .limit(1)

      const today = new Date().toISOString().split('T')[0]
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

      if (!existingSub || existingSub.length === 0) {
        // No subscription row — create one with 1 free credit
        await service.from('subscriptions').insert({
          user_id: data.user.id,
          plan: 'free',
          monthly_limit_tokens: 0,
          current_period_start: today,
          current_period_end: in30,
          extra_tokens: 0,
          credits: 1,
          stripe_customer_id: null,
          stripe_subscription_id: null,
        })
      } else if (existingSub[0].credits < 1) {
        // Trigger created row but with 0 credits — fix it
        await service.from('subscriptions')
          .update({ credits: 1 })
          .eq('id', existingSub[0].id)
      }
    } catch (err) {
      console.error('[auth] signUp subscription seed failed:', err)
      // Don't block signup — DB trigger may have already handled it correctly
    }
  }

  return { success: true, email: email as string }
}

export async function resendConfirmation(_prevState: unknown, formData: FormData) {
  const email = formData.get('email')
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return { error: 'Geçerli bir e-posta adresi girin.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://netportai.com'}/auth/callback`,
    },
  })

  if (error) {
    console.error('[auth] resendConfirmation error:', error.message)
    return { error: 'Mail gönderilemedi. Lütfen tekrar deneyin.' }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(_prevState: unknown, formData: FormData) {
  const email = formData.get('email')
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return { error: 'Geçerli bir e-posta adresi girin.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://netportai.com'}/auth/reset-password`,
  })

  // Always return success to prevent email enumeration
  if (error) {
    console.error('[auth] resetPasswordForEmail error:', error.message)
  }

  return { success: true }
}

export async function updatePassword(_prevState: unknown, formData: FormData) {
  const password = formData.get('password')
  const confirm = formData.get('confirm_password')

  if (!password || typeof password !== 'string' || password.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalı.' }
  }
  if (typeof confirm !== 'string') {
    return { error: 'Şifreler eşleşmiyor.' }
  }
  if (password !== confirm) {
    return { error: 'Şifreler eşleşmiyor.' }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Oturum süresi dolmuş. Lütfen tekrar şifre sıfırlama isteği gönderin.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    console.error('[auth] updateUser error:', error.message)
    return { error: 'Şifre güncellenemedi. Lütfen tekrar şifre sıfırlama isteği gönderin.' }
  }

  redirect('/dashboard')
}
