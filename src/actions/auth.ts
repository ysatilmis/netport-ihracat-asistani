'use server'
import { createClient } from '@/lib/supabase/server'
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
  const { error } = await supabase.auth.signUp({
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

  return { success: true, email: email as string }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
