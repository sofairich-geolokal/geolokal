import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the shape of your database result to fix the "unknown" type error
interface UserQueryResult {
  rows: Array<{
    role?: string;
  }>;
}

// List of paths that don't require authentication
const publicPaths = [
  '/',
  '/lgu-login',
  '/superadmin/login',
  '/viewerDashboard/viewerlogin',
  '/viewerDashboard/location-selection',
  '/api/lgu/login',
  '/api/viewer/login',
  '/_next',
  '/favicon.ico',
  '/api',
  '/geoserver',
  '/geonode',
];

// GeoNode proxy configuration
const geonodePaths = [
  '/geoserver/',
  '/api/geoserver',
];

async function proxyToGeonode(request: NextRequest, pathname: string) {
  const geonodeUrl = process.env.GEONODE_URL || 'http://localhost:8000';
  const geoserverUrl = process.env.GEOSERVER_URL || 'http://localhost:8080/geoserver';
  
  let targetUrl: string;
  if (pathname.startsWith('/geoserver/')) {
    targetUrl = `${geoserverUrl}${pathname.replace('/geoserver', '')}`;
  } else {
    targetUrl = `${geonodeUrl}${pathname}`;
  }
  
  const url = new URL(request.url);
  const proxyUrl = new URL(targetUrl);
  proxyUrl.search = url.searchParams.toString();
  
  try {
    const response = await fetch(proxyUrl.toString(), {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || '',
        'Authorization': request.headers.get('authorization') || '',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        'X-Forwarded-Proto': request.nextUrl.protocol,
        'X-Forwarded-Host': request.nextUrl.host,
      },
      // Middleware requires body to be handled carefully
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    });
    
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    if (pathname.startsWith('/geoserver/')) {
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range');
    }
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  }
}

/**
 * Next.js Proxy must be named 'proxy' and exported
 * from a file named proxy.ts in the root.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle GeoNode proxy requests first
  if (geonodePaths.some(path => pathname.startsWith(path))) {
    return await proxyToGeonode(request, pathname);
  }

  // 2. Check if the path is public
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 3. Check for auth token
  const authToken = request.cookies.get('auth_token')?.value;

  const handleAuthRedirect = () => {
    if (pathname.startsWith('/viewerDashboard')) {
      return NextResponse.redirect(new URL('/viewerDashboard/viewerlogin', request.url));
    } else if (pathname.startsWith('/superadmin')) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    } else {
      return NextResponse.redirect(new URL('/lgu-login', request.url));
    }
  };

  if (!authToken) {
    return handleAuthRedirect();
  }

  // 4. Extract user ID from token
  const tokenParts = authToken.split('_');
  if (tokenParts.length !== 3 || tokenParts[0] !== 'token') {
    return handleAuthRedirect();
  }

  const userId = tokenParts[1];
  // If role is the 3rd part of your token (token_id_role)
  const userRole = tokenParts[2]?.toLowerCase();

  // 5. Role-based access control
  if (pathname.startsWith('/lgu-dashboard')) {
    if (userRole !== 'lgu') {
      return NextResponse.redirect(new URL('/lgu-login', request.url));
    }
  } else if (pathname.startsWith('/superadmin')) {
    if (userRole !== 'superadmin' && !pathname.endsWith('/login')) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url));
    }
  } else if (pathname.startsWith('/viewerDashboard')) {
    const isLoginPage = pathname.includes('viewerlogin') || pathname.includes('location-selection');
    if (userRole !== 'viewer' && !isLoginPage) {
      return NextResponse.redirect(new URL('/viewerDashboard/viewerlogin', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure the config is exported correctly
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};