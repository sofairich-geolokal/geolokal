import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';

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
  // GeoNode public paths
  '/geoserver',
  '/geonode',
];

// GeoNode proxy configuration
const geonodePaths = [
  '/geoserver/',
  '/api/geoserver',
];

async function getUserRole(userId: string) {
  try {
    const result = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.role?.toLowerCase() || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

async function proxyToGeonode(request: NextRequest, pathname: string) {
  const geonodeUrl = process.env.GEONODE_URL || 'http://localhost:8000';
  const geoserverUrl = process.env.GEOSERVER_URL || 'http://localhost:8080/geoserver';
  
  let targetUrl;
  if (pathname.startsWith('/geoserver/')) {
    targetUrl = `${geoserverUrl}${pathname.replace('/geoserver', '')}`;
  } else {
    targetUrl = `${geonodeUrl}${pathname}`;
  }
  
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const proxyUrl = new URL(targetUrl);
  proxyUrl.search = searchParams.toString();
  
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
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    });
    
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    // Add CORS headers for geoserver
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle GeoNode proxy requests first
  if (geonodePaths.some(path => pathname.startsWith(path))) {
    return await proxyToGeonode(request, pathname);
  }

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
    } else if (pathname.startsWith('/superadmin')) {
      const loginUrl = new URL('/superadmin/login', request.url);
      return NextResponse.redirect(loginUrl);
    } else {
      const loginUrl = new URL('/lgu-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Extract user ID from token
  const tokenParts = authToken.split('_');
  if (tokenParts.length !== 3 || tokenParts[0] !== 'token') {
    // Invalid token format, redirect to appropriate login
    if (pathname.startsWith('/viewerDashboard')) {
      const loginUrl = new URL('/viewerDashboard/viewerlogin', request.url);
      return NextResponse.redirect(loginUrl);
    } else if (pathname.startsWith('/superadmin')) {
      const loginUrl = new URL('/superadmin/login', request.url);
      return NextResponse.redirect(loginUrl);
    } else {
      const loginUrl = new URL('/lgu-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const userId = tokenParts[1];
  const userRole = await getUserRole(userId);

  // Role-based access control
  if (pathname.startsWith('/lgu-dashboard')) {
    // Only allow LGU users (not superadmin or viewer)
    if (userRole !== 'lgu') {
      const loginUrl = new URL('/lgu-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } else if (pathname.startsWith('/superadmin')) {
    // Only allow superadmin users
    if (userRole !== 'superadmin') {
      const loginUrl = new URL('/superadmin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  } else if (pathname.startsWith('/viewerDashboard')) {
    // Only allow viewer users
    if (userRole !== 'viewer') {
      const loginUrl = new URL('/viewerDashboard/viewerlogin', request.url);
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
     * - superadmin/login (superadmin login page)
     * - viewerDashboard/viewerlogin (viewer login page)
     * - viewerDashboard/location-selection (city selection page)
     * - / (root page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|lgu-login|superadmin/login|viewerDashboard/viewerlogin|viewerDashboard/location-selection|$).*)/',
  ],
};
