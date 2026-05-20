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

  if (!user && !path.startsWith('/login') && !path.startsWith('/register')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: userData } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
