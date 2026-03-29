import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_LOGIN_PATH = '/admin/login';

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function isAdminLoginPage(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH;
}

function secureHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // CSP: allow self + Supabase + Stripe + PostHog + Cal.com
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://app.posthog.com https://cal.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://app.posthog.com https://api.cal.com",
      "frame-src https://js.stripe.com https://cal.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return secureHeaders(supabaseResponse);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh the auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect admin routes — redirect unauthenticated users to /admin/login
  if (isAdminRoute(pathname) && !isAdminLoginPage(pathname)) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = ADMIN_LOGIN_PATH;
      loginUrl.searchParams.set('next', pathname);
      return secureHeaders(NextResponse.redirect(loginUrl));
    }

    // Verify admin email
    const adminEmailsRaw = process.env.ADMIN_EMAILS ?? '';
    const adminEmails = adminEmailsRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = user.email?.toLowerCase() ?? '';
    if (adminEmails.length > 0 && !adminEmails.includes(userEmail)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = ADMIN_LOGIN_PATH;
      loginUrl.searchParams.set('error', 'forbidden');
      return secureHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return secureHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    // Match all routes except static files and API health check
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
