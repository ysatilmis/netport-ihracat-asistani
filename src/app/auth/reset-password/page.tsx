'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password')
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login?error=auth_callback_error')
      }
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/reset-password')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Dogrulanıyor...</p>
      </div>
    </div>
  )
}
