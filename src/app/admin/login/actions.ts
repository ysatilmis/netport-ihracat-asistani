'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function adminSignIn(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Email adresiniz henüz onaylanmamış.' }
    }
    if (error.message.includes('Invalid login')) {
      return { error: 'Email veya şifre hatalı.' }
    }
    return { error: error.message }
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
