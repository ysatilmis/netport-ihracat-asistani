'use server'
import { createServiceClient } from '@/lib/supabase/server'

export async function submitFeedback(
  rating: number,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!message.trim()) return { ok: false, error: 'Mesaj boş olamaz' }
  if (rating < 1 || rating > 5) return { ok: false, error: 'Geçersiz puan' }
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('feedback')
    .insert({ rating, message: message.trim() })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
