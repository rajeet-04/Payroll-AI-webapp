import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow access to login, public pages, and API routes (proxied to backend)
  if (pathname === '/login' || pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // Check if user has any session-related cookie (access_token, refresh_token, csrf_token)
  const accessToken = request.cookies.get('access_token')
  const refreshToken = request.cookies.get('refresh_token')
  const csrfToken = request.cookies.get('csrf_token')
  
  // Debug logging
  console.log('Middleware check:', {
    pathname,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasCsrfToken: !!csrfToken,
    cookies: request.cookies.getAll().map(c => c.name)
  })

  // If trying to access protected /app routes without any session cookie, redirect to login
  if (pathname.startsWith('/app') && !(accessToken || refreshToken || csrfToken)) {
    console.log('No session cookies found, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Allow the request to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
