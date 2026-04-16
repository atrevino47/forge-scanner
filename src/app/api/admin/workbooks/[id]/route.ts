// GET /api/admin/workbooks/[id]
// Returns a single workbook submission with full answers

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/db/client';
import { requireAdminSession } from '@/lib/auth/admin';
import type { AdminWorkbookDetailResponse, ApiError } from '@/../contracts/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AdminWorkbookDetailResponse | ApiError>> {
  try {
    const authError = await requireAdminSession(request);
    if (authError) return authError as NextResponse<ApiError>;

    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('workbook_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Workbook not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: data.id,
      clientName: data.client_name,
      businessName: data.business_name,
      locale: data.locale,
      answers: data.answers as Record<string, string>,
      completedCount: data.completed_count,
      totalFields: data.total_fields,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Unexpected error' } },
      { status: 500 },
    );
  }
}
