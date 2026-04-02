import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// List of paths that don't require authentication
const publicPaths = [
  '/',
  '/lgu-login',
  '/viewerDashboard/viewerlogin',
  '/viewerDashboard/location-selection',
  '/api/lgu/login',
  '/api/viewer/login',
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

  // If no auth token and trying to access protected route, redirect to appropriate login
  if (!authToken) {
    // Determine which login page to redirect to based on the requested path
    if (pathname.startsWith('/viewerDashboard')) {
      const loginUrl = new URL('/viewerDashboard/viewerlogin', request.url);
      return NextResponse.redirect(loginUrl);
    } else {
      const loginUrl = new URL('/lgu-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
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
     * - viewerDashboard/viewerlogin (viewer login page)
     * - viewerDashboard/location-selection (city selection page)
     * - / (root page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|lgu-login|viewerDashboard/viewerlogin|viewerDashboard/location-selection|$).*)/',
  ],
};
