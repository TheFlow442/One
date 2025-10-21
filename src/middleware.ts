import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'volta_view_session';


// Since we cannot use firebase-admin in the edge runtime,
// we will do a basic check for the existence of the session cookie.
// The actual verification will happen on the pages/components that need authentication.
// For this simple app, we can assume if the cookie is present, the user is likely authenticated.
// A more robust solution for production might involve an API route running on a node runtime
// to verify the cookie.
async function checkAuth(cookie: string | undefined) {
  return !!cookie;
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/';
  const isDashboard = pathname.startsWith('/dashboard');

  let isAuthenticated = await checkAuth(sessionCookie);

  // If user is on auth page but already authenticated, redirect to dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is trying to access dashboard but is not authenticated, redirect to auth page
  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Middleware should run on authentication page and dashboard pages
export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
