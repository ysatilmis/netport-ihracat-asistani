'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Email adresiniz henüz onaylanmamış. Lütfen mail kutunuzu kontrol edin ve onay linkine tıklayın.' }
    }
    return { error: error.message }
  }
  redirect('/dashboard')
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signUp({
    email,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('full_name') as string },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://netportai.com'}/auth/callback`,
    },
  })

  if (error) {
    // Duplicate / already registered
    if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('unique')) {
      return { error: `"${email}" ile zaten bir hesap oluşturulmuş. Lütfen giriş yapın veya şifrenizi sıfırlayın.` }
    }
    return { error: error.message }
  }

  // Show confirmation notice — user stays on page to see the message
  return { success: true, email }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
