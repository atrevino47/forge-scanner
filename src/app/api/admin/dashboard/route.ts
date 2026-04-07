// GET /api/admin/dashboard
// Returns aggregate metrics for the admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import type { AdminDashboardResponse, ApiError } from '@/../contracts/api';
import { getAdminDashboardMetrics } from '@/lib/db/admin-queries';
import { requireAdminSession } from '@/lib/auth/admin';

export async function GET(request: NextRequest): Promise<NextResponse<AdminDashboardResponse | ApiError>> {
  try {
    const authError = await requireAdminSession(request);
    if (authError) return authError as NextResponse<ApiError>;

    const metrics = await getAdminDashboardMetrics();
    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch dashboard metrics',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
