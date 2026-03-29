// GET /api/admin/dashboard
// Returns aggregate metrics for the admin dashboard

import { NextResponse } from 'next/server';
import type { AdminDashboardResponse, ApiError } from '@/../contracts/api';
import { getAdminDashboardMetrics } from '@/lib/db/admin-queries';

export async function GET(): Promise<NextResponse<AdminDashboardResponse | ApiError>> {
  try {
    // TODO: Wire admin auth once ADMIN_EMAILS is configured
    // For now, admin routes are accessible without auth (localhost-only)

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
