import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/referral') ||
    pathname.startsWith('/sessions');

  if (isProtected) {
    const accessToken =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('drgame_access_token')?.value ||
      request.cookies.get('drgame_session')?.value;

    if (!accessToken) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('auth', 'required');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/referral/:path*',
    '/sessions/:path*',
  ],
};
