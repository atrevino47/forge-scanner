// src/lib/auth/admin.ts
// Thin wrapper around requireAdmin that returns NextResponse errors
// instead of throwing, for use in API route handlers.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from './config';
import type { ApiError } from '../../../contracts/api';

/**
 * Guards an API route handler — returns a 401/403 NextResponse if the request
 * is not from an authenticated admin, otherwise returns null (all good).
 *
 * Usage:
 *   const authError = await requireAdminSession(request);
 *   if (authError) return authError;
 */
export async function requireAdminSession(
  request: NextRequest
): Promise<NextResponse<ApiError> | null> {
  try {
    await requireAdmin(request);
    return null;
  } catch (err) {
    if (err instanceof AuthError) {
      const body: ApiError = {
        error: { code: err.code, message: err.message },
      };
      return NextResponse.json(body, { status: err.status });
    }
    // Unexpected error — treat as 500
    const body: ApiError = {
      error: { code: 'INTERNAL', message: 'Auth check failed' },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
