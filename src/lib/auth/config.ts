// src/lib/auth/config.ts
// Auth helpers for API route handlers

import { type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createServerClient as createSSRClient } from '@supabase/ssr';

/**
 * Extracts the authenticated user from the Supabase session cookie.
 * Returns `{ user: null }` if no valid session exists.
 */
export async function getUser(
  request: NextRequest
): Promise<{ user: User | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
    );
  }

  // Build a read-only Supabase client from request cookies
  const supabase = createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Route handlers can't set cookies on the request object.
        // Session refresh is handled by middleware.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user };
}

/**
 * Checks that the current user is an admin.
 * Admin emails are configured via the ADMIN_EMAILS environment variable
 * as a comma-separated list: "alice@forge.com,bob@forge.com"
 *
 * Throws a structured error if the user is not authenticated or not an admin.
 */
export async function requireAdmin(request: NextRequest): Promise<User> {
  const { user } = await getUser(request);

  if (!user) {
    throw new AuthError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const adminEmailsRaw = process.env.ADMIN_EMAILS ?? '';
  const adminEmails = adminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    throw new AuthError(
      'UNAUTHORIZED',
      'No admin emails configured',
      403
    );
  }

  const userEmail = user.email?.toLowerCase();
  if (!userEmail || !adminEmails.includes(userEmail)) {
    throw new AuthError('UNAUTHORIZED', 'Admin access required', 403);
  }

  return user;
}

/**
 * Structured auth error for consistent handling in API routes.
 */
export class AuthError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}
