import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuth } from 'firebase-admin/auth';
import { initializeAdminApp } from '@/firebase/admin';

const SESSION_COOKIE_NAME = 'volta_view_session';

initializeAdminApp();

async function verifySessionCookie(cookie: string) {
  try {
    await getAuth().verifySessionCookie(cookie, true);
    return true;
  } catch (error) {
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

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
