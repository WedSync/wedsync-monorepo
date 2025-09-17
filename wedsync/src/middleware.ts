import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authUtils } from '@wedsync/utils/auth';

// Define routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/_next',
  '/favicon.ico',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password'
];

// Define API routes that require authentication
const protectedApiRoutes = [
  '/api/dashboard',
  '/api/forms',
  '/api/journeys',
  '/api/clients',
  '/api/communications'
];

// Define protected page routes
const protectedPageRoutes = [
  '/dashboard',
  '/forms',
  '/journeys',
  '/clients',
  '/communications'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get token from Authorization header or cookies
  const authHeader = request.headers.get('authorization');
  const token = authUtils.extractBearerToken(authHeader) || 
                request.cookies.get('auth-token')?.value;

  // Check if route requires authentication
  const isProtectedPage = protectedPageRoutes.some(route => pathname.startsWith(route));
  const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route));

  if (isProtectedPage || isProtectedApi) {
    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Redirect to login page for protected pages
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token validity (you might want to implement JWT verification here)
    try {
      // For now, we'll just check if token exists and is not empty
      // In a real implementation, you'd verify the JWT token here
      if (!token || token.trim() === '') {
        throw new Error('Invalid token');
      }

      // You could add additional checks here like:
      // - JWT verification
      // - Token blacklist check
      // - User role validation
      
      // Add user info to request headers for API routes
      if (isProtectedApi) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-auth-token', token);
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
      
      return NextResponse.next();
    } catch (error) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      
      // Redirect to login for invalid tokens
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

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