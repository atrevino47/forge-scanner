// src/lib/api-utils.ts
// Shared utilities for API route handlers

import { NextResponse, type NextRequest } from 'next/server';
import type { ZodType } from 'zod';
import type { ApiError } from '../../contracts/api';

/**
 * Build a standard JSON error response matching the ApiError contract.
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiError> {
  const body: ApiError = {
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };

  return NextResponse.json(body, { status });
}

/**
 * Parse and validate the JSON body of a request using a Zod schema.
 * Returns the validated data or throws a NextResponse error.
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodType<T>
): Promise<T> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    throw apiError('INVALID_INPUT', 'Request body must be valid JSON', 400);
  }

  const result = schema.safeParse(raw);

  if (!result.success) {
    throw apiError(
      'INVALID_INPUT',
      'Validation failed',
      400,
      result.error.issues
    );
  }

  return result.data;
}

/**
 * Parse and validate URL search params using a Zod schema.
 * Converts URLSearchParams into a plain object before validation.
 */
export function validateQuery<T>(url: URL, schema: ZodType<T>): T {
  const params: Record<string, string> = {};

  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    throw apiError(
      'INVALID_INPUT',
      'Invalid query parameters',
      400,
      result.error.issues
    );
  }

  return result.data;
}

/**
 * CSRF protection: verifies the Origin or Referer header matches the app host.
 * Returns true (allowed) if the request passes the check.
 *
 * Should be called on all state-mutating endpoints (POST/PUT/DELETE) that
 * operate on behalf of a session. Skips check for API-key-only routes.
 *
 * Note: Next.js App Router + Supabase SSR cookies are SameSite=Lax by default,
 * which provides baseline CSRF protection. This adds an explicit host check as
 * a defense-in-depth measure.
 */
export function verifyCsrf(request: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    // Can't verify without knowing the app URL — fail open in dev, fail closed in prod
    return process.env.NODE_ENV !== 'production';
  }

  let appHost: string;
  try {
    appHost = new URL(appUrl).host;
  } catch {
    return false;
  }

  // Check Origin header first (most reliable)
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === appHost;
    } catch {
      return false;
    }
  }

  // Fall back to Referer header
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === appHost;
    } catch {
      return false;
    }
  }

  // No origin or referer — reject (could be a cross-site form POST)
  return false;
}

/**
 * Extract the client IP address from the request.
 * Checks x-forwarded-for (set by Vercel / reverse proxies) first,
 * then falls back to x-real-ip.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Last resort fallback — should not happen behind a proxy
  return '0.0.0.0';
}
