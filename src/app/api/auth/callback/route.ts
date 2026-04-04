import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { ApiError } from '@/../contracts/api';

// ============================================================
// GET /api/auth/callback
// Handles Supabase OAuth callback after provider authentication.
// Exchanges the authorization code for a session, sets cookies,
// and redirects the user to the origin URL or /.
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiError> | Response> {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // Validate `next` to prevent open redirect — must be a relative path
    const rawNext = searchParams.get('next') ?? '/';
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

    if (!code) {
      console.warn('[auth/callback] No authorization code in callback URL');
      return NextResponse.redirect(new URL(`/?error=no_code`, origin));
    }

    // Build the redirect URL — default to origin root, or the `next` param if provided
    const redirectTo = new URL(next, origin);

    // Create a mutable response to attach cookies to
    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] Code exchange failed:', error.message);
      return NextResponse.redirect(new URL(`/?error=auth_failed`, origin));
    }

    console.log('[auth/callback] Session established, redirecting to:', redirectTo.pathname);
    return response;
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err);

    // Attempt a safe redirect on failure rather than returning JSON
    try {
      const origin = new URL(request.url).origin;
      return NextResponse.redirect(new URL(`/?error=callback_error`, origin));
    } catch {
      // Last resort: return a JSON error if we cannot even parse the URL
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Authentication callback failed. Please try signing in again.',
            details: process.env.NODE_ENV === 'development' ? String(err) : undefined,
          },
        },
        { status: 500 }
      );
    }
  }
}
