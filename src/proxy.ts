import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function proxy(req: NextRequest) {
  const { nextUrl } = req

  const isAuthPage = nextUrl.pathname === '/login'
  const isSSOCallback = nextUrl.pathname.startsWith('/sso')
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth')
  const isApiDebug = nextUrl.pathname.startsWith('/api/debug')
  const isStaticFile = nextUrl.pathname.startsWith('/_next/static') ||
                       nextUrl.pathname === '/favicon.ico' ||
                       nextUrl.pathname.startsWith('/images') ||
                       nextUrl.pathname === '/logo.png'
  const hasToken = nextUrl.searchParams.has('token') && nextUrl.searchParams.has('sig')

  // Handle SSO token at root - redirect to SSO handler
  if (hasToken && nextUrl.pathname === '/') {
    const token = nextUrl.searchParams.get('token')
    const sig = nextUrl.searchParams.get('sig')
    return NextResponse.redirect(new URL(`/api/auth/sso?token=${token}&sig=${sig}`, 'https://sibatik.idbbali.ac.id'))
  }

  // Allow public paths
  if (isSSOCallback || isApiAuth || isApiDebug || isStaticFile) {
    return NextResponse.next()
  }

  // Check session
  const sessionCookie = req.cookies.get('helpdesk-session')
  let isLoggedIn = false

  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'helpdesk-idb-bali-secret-2024-final')
      await jwtVerify(sessionCookie.value, secret)
      isLoggedIn = true
    } catch {}
  }

  // Also check next-auth session cookie
  const nextAuthCookie = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token')
  if (nextAuthCookie) {
    isLoggedIn = true
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', 'https://sibatik.idbbali.ac.id'))
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', 'https://sibatik.idbbali.ac.id'))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|logo\\.png).*)'],
}
