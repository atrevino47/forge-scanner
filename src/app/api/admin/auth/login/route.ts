// POST /api/admin/auth/login
// Email/password login for admin users via Supabase Auth

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/api-utils';
import type { ApiError } from '@/../contracts/api';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(clientIp, 'ip_api', 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      const body: ApiError = {
        error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' },
      };
      return NextResponse.json(body, { status: 429 });
    }

    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const errBody: ApiError = {
        error: { code: 'INVALID_INPUT', message: parsed.error.issues[0]?.message ?? 'Invalid input' },
      };
      return NextResponse.json(errBody, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Verify email is in the admin list before attempting Supabase login
    const adminEmailsRaw = process.env.ADMIN_EMAILS ?? '';
    const adminEmails = adminEmailsRaw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length === 0 || !adminEmails.includes(email.toLowerCase())) {
      // Return same error as wrong password to avoid email enumeration
      const errBody: ApiError = {
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      };
      return NextResponse.json(errBody, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Build response first so we can set cookies on it
    let response = NextResponse.json({ success: true }, { status: 200 });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Rebuild response with cookies
          response = NextResponse.json({ success: true }, { status: 200 });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const errBody: ApiError = {
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      };
      return NextResponse.json(errBody, { status: 401 });
    }

    return response;
  } catch (err) {
    const errBody: ApiError = {
      error: { code: 'INTERNAL', message: 'Login failed', details: err instanceof Error ? err.message : undefined },
    };
    return NextResponse.json(errBody, { status: 500 });
  }
}

// POST /api/admin/auth/logout
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let response = NextResponse.json({ success: true }, { status: 200 });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.json({ success: true }, { status: 200 });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}
