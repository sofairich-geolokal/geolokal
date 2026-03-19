import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of paths that don't require authentication
const publicPaths = [
  '/',
  '/lgu-login',
  '/api/lgu/login',
  '/_next',
  '/favicon.ico',
  '/api',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for auth token
  const authToken = request.cookies.get('auth_token')?.value;

  // If no auth token and trying to access protected route, redirect to login
  if (!authToken) {
    const loginUrl = new URL('/lgu-login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access to protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - lgu-login (login page)
     * - / (root page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|lgu-login|$).*)',
  ],
};
