'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function adminSignIn(_prevState: unknown, formData: FormData) {
  const email = formData.get('email')
  const password = formData.get('password')

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return { error: 'Geçerli bir e-posta adresi girin.' }
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return { error: 'Şifre en az 6 karakter olmalı.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: email as string,
    password: password as string,
  })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Email adresiniz henüz onaylanmamış.' }
    }
    if (error.message.includes('Invalid login') || error.message.includes('invalid')) {
      return { error: 'Email veya şifre hatalı.' }
    }
    return { error: 'Giriş yapılırken bir hata oluştu.' }
  }

  // Admin kontrolü
  const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(email.toLowerCase())) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
      .single() as { data: { role: string } | null }

    if (userData?.role !== 'admin') {
      await supabase.auth.signOut()
      return { error: 'Bu hesap admin yetkisine sahip değil.' }
    }
  }

  redirect('/admin')
}
