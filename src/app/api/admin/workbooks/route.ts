// GET /api/admin/workbooks
// Returns paginated list of workbook submissions for admin

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { requireAdminSession } from '@/lib/auth/admin';
import type { AdminWorkbooksResponse, AdminWorkbookRow, ApiError } from '@/../contracts/api';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<AdminWorkbooksResponse | ApiError>> {
  try {
    const authError = await requireAdminSession(request);
    if (authError) return authError as NextResponse<ApiError>;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid query parameters', details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;
    const supabase = createServiceClient();

    // Count total
    const { count } = await supabase
      .from('workbook_submissions')
      .select('*', { count: 'exact', head: true });

    // Fetch page
    const { data, error } = await supabase
      .from('workbook_submissions')
      .select('id, client_name, business_name, locale, completed_count, total_fields, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Failed to fetch workbooks', details: error.message } },
        { status: 500 },
      );
    }

    const workbooks: AdminWorkbookRow[] = (data ?? []).map((row) => ({
      id: row.id,
      clientName: row.client_name,
      businessName: row.business_name,
      locale: row.locale,
      completedCount: row.completed_count,
      totalFields: row.total_fields,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      workbooks,
      total: count ?? 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Unexpected error' } },
      { status: 500 },
    );
  }
}
