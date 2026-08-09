import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifyJwtToken, AUTH_COOKIE_NAME } from '@/lib/jwt';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Fully protected routes: require authentication and specific roles
  const fullyProtectedPaths = ['/authority', '/api/officer'];
  const isFullyProtected = fullyProtectedPaths.some(p => path.startsWith(p));
  
  // Specific API method protections
  const isProtectedApiGrievances = path === '/api/grievances' && (request.method === 'POST' || request.method === 'PATCH');
  
  // Semi-protected routes: require basic authentication
  const semiProtectedPaths = ['/report', '/dashboard', '/benefits'];
  const isSemiProtected = semiProtectedPaths.some(p => path.startsWith(p)) || 
                          path.match(/^\/api\/grievances\/.*\/confirm$/) || 
                          path.match(/^\/api\/grievances\/.*\/verify$/);

  const needsAuth = isFullyProtected || isProtectedApiGrievances || isSemiProtected;

  // 1. Check JWT Cookie / Header Auth first
  const jwtCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const jwtToken = jwtCookie || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

  let authenticatedUser: { id: string; email: string; name: string; role: string } | null = null;

  if (jwtToken) {
    const payload = await verifyJwtToken(jwtToken);
    if (payload) {
      authenticatedUser = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };
    }
  }

  // 2. Check Supabase SSR session if not authenticated by JWT
  if (!authenticatedUser) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createServerClient(
          supabaseUrl,
          supabaseAnonKey,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = NextResponse.next({
                  request,
                });
                cookiesToSet.forEach(({ name, value, options }) =>
                  supabaseResponse.cookies.set(name, value, options)
                );
              },
            },
          }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          authenticatedUser = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || '',
            role: user.user_metadata?.role || 'citizen',
          };
        }
      } catch (e) {
        // Continue with unauthenticated state
      }
    }
  }

  // If the route needs auth and the user is not authenticated
  if (needsAuth && !authenticatedUser) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }
    
    url.pathname = '/auth/login';
    url.searchParams.set('returnUrl', path);
    return NextResponse.redirect(url);
  }

  // Role checks for authority/officer routes
  if (isFullyProtected && authenticatedUser) {
    const role = authenticatedUser.role;
    if (role !== 'officer' && role !== 'admin') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden: Officer role required' }, { status: 403 });
      }
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};