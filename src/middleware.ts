
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The root of the site is the splash screen. This is the only rewrite.
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/splash', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - splash (the splash screen itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|splash).*)',
  ],
}
