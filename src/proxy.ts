import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

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

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // If the route needs auth and the user is not authenticated
  if ((isFullyProtected || isProtectedApiGrievances || isSemiProtected) && !user) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    url.pathname = '/auth/login';
    url.searchParams.set('returnUrl', path);
    return NextResponse.redirect(url);
  }

  // Role checks for authority/officer routes
  if (isFullyProtected && user) {
    const role = user.user_metadata?.role;
    if (role !== 'officer' && role !== 'admin') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
