import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const SESSION_COOKIE_NAME = 'volta_view_session';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const {pathname} = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  if (!sessionCookie) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    // Redirect to login if no session and not on an auth page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there's a session and user is on an auth page, redirect to dashboard
  if (isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
