// GET /api/admin/payments
// Returns paginated payments with revenue summary for admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { AdminPaymentsResponse, ApiError } from '@/../contracts/api';
import { getAdminPayments } from '@/lib/db/admin-queries';
import { requireAdminSession } from '@/lib/auth/admin';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  status: z.enum(['all', 'succeeded', 'pending', 'failed', 'refunded']).default('all'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse<AdminPaymentsResponse | ApiError>> {
  try {
    const authError = await requireAdminSession(request);
    if (authError) return authError as NextResponse<ApiError>;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid query parameters', details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const result = await getAdminPayments(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Failed to fetch payments', details: error instanceof Error ? error.message : undefined } },
      { status: 500 },
    );
  }
}
