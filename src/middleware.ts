import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/firebase/admin';

const SESSION_COOKIE_NAME = 'volta_view_session';

// Initialize Firebase Admin SDK. This should be done only once.
// The try-catch block is to avoid re-initializing the app in hot-reload environments.
try {
  initializeAdminApp();
} catch (e) {
  console.log(e);
}


async function verifySessionCookie(cookie: string) {
  try {
    // Using the firebase-admin SDK to verify the session cookie
    await getAuth().verifySessionCookie(cookie, true);
    return true;
  } catch (error) {
    console.error('Session cookie verification failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/';
  const isDashboard = pathname.startsWith('/dashboard');

  let isAuthenticated = false;
  if (sessionCookie) {
    isAuthenticated = await verifySessionCookie(sessionCookie);
  }

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
