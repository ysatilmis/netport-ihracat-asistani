import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Sadece admin kullanıcılar erişebilir
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase())
  if (user.email && !adminEmails.includes(user.email.toLowerCase())) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase.from('users') as any)
      .select('role').eq('id', user.id).single() as { data: { role: string } | null }
    if (userData?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const checks: Record<string, string> = {
    NODE_ENV: process.env.NODE_ENV ?? 'unknown',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'set (redacted)' : 'MISSING',
  }

  return Response.json({
    timestamp: new Date().toISOString(),
    envVars: checks,
  })
}
