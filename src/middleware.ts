import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// We are temporarily bypassing authentication to allow for easier development.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
