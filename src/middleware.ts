import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import * as admin from 'firebase-admin';

const SESSION_COOKIE_NAME = '__session';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  // In a deployed environment, GOOGLE_APPLICATION_CREDENTIALS will be set
  // In a local environment, you need to set this env var to point to your service account key file
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (e) {
    console.error('Firebase Admin initialization error:', e);
  }
}

async function verifySessionCookie(cookie: string) {
  try {
    await admin.auth().verifySessionCookie(cookie, true);
    return true;
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const {pathname} = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const sessionValid = sessionCookie ? await verifySessionCookie(sessionCookie) : false;

  if (!sessionValid) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    // Redirect to login if no valid session and not on an auth page
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME); // Clean up invalid cookie
    return response;
  }

  // If there's a valid session and user is on an auth page, redirect to dashboard
  if (isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
