
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = '__session';

function initializeAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (e) {
      console.error('Firebase Admin initialization error:', e);
    }
  }
}

async function verifySessionCookie(cookie: string) {
  initializeAdmin();
  try {
    await admin.auth().verifySessionCookie(cookie, true);
    return true;
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  
  if (!sessionCookie) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const sessionValid = await verifySessionCookie(sessionCookie);

  if (!sessionValid) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
