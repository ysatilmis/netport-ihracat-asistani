import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, string> = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? `set (${process.env.OPENROUTER_API_KEY.slice(0, 12)}...)` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV ?? 'unknown',
  }

  // OpenRouter'a basit ping
  let openrouterPing = 'not tested'
  const apiKey = process.env.OPENROUTER_API_KEY
  if (apiKey) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      })
      openrouterPing = resp.ok ? `OK (${resp.status})` : `FAIL (${resp.status})`
    } catch (e) {
      openrouterPing = `ERROR: ${(e as Error).message}`
    }
  }

  // Supabase auth check
  let supabaseAuth = 'not tested'
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getUser()
    supabaseAuth = error ? `error: ${error.message}` : 'user call OK (no session expected)'
  } catch (e) {
    supabaseAuth = `ERROR: ${(e as Error).message}`
  }

  return Response.json({
    timestamp: new Date().toISOString(),
    envVars: checks,
    openrouterPing,
    supabaseAuth,
  })
}
