'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('users') as any).update({
    product_name: formData.get('product_name') as string,
    target_country: formData.get('target_country') as string,
    full_name: formData.get('full_name') as string,
  }).eq('id', user.id)

  revalidatePath('/dashboard')
}
