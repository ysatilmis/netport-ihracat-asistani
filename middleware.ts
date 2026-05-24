import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const STATIC_EXT = /\.(png|svg|jpg|jpeg|gif|webp|ico|woff2?|ttf|css|js|map)$/i

function isPublicAsset(path: string) {
  return (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path === '/favicon.ico' ||
    STATIC_EXT.test(path)
  )
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (isPublicAsset(path)) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !path.startsWith('/login') && !path.startsWith('/register') && path !== '/admin/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path.startsWith('/admin')) {
    // /admin/login herkese açık
    if (path === '/admin/login') {
      return supabaseResponse
    }

    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))

    // Auto-admin: ADMIN_EMAIL ile eşleşen kullanıcıya rol sormadan izin ver
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase())
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return supabaseResponse
    }

    const { data: userData } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
