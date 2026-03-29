// GET /api/admin/leads
// Returns paginated lead list for admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { AdminLeadsResponse, ApiError } from '@/../contracts/api';
import { getAdminLeads } from '@/lib/db/admin-queries';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['all', 'has_email', 'no_email', 'booked', 'converted']).default('all'),
  source: z.enum(['organic', 'outreach', 'ad']).optional(),
  sortBy: z.enum(['created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse<AdminLeadsResponse | ApiError>> {
  try {
    // TODO: Wire admin auth once ADMIN_EMAILS is configured

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid query parameters',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const result = await getAdminLeads(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch leads',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
