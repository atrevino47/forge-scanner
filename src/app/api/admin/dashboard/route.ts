// GET /api/admin/dashboard
// Returns aggregate metrics for the admin dashboard

import { NextResponse } from 'next/server';
import type { AdminDashboardResponse, ApiError } from '@/../contracts/api';

export async function GET(): Promise<NextResponse<AdminDashboardResponse | ApiError>> {
  try {
    // TODO: Verify admin authentication
    // TODO: Aggregate actual metrics from Supabase

    const mockResponse: AdminDashboardResponse = {
      totalScans: 247,
      totalLeads: 183,
      leadsWithEmail: 142,
      leadsWithPhone: 89,
      totalBookings: 31,
      totalRevenue: 4650000, // $46,500 in cents
      conversionRate: 12.7, // 12.7% scan-to-booking
      recentScans: [
        {
          id: 'scan_recent_001',
          websiteUrl: 'https://acmeplumbing.com',
          leadEmail: 'sarah@acmeplumbing.com',
          status: 'completed',
          createdAt: '2026-03-18T09:30:00.000Z',
        },
        {
          id: 'scan_recent_002',
          websiteUrl: 'https://sunsetdental.com',
          leadEmail: 'mike@sunsetdental.com',
          status: 'completed',
          createdAt: '2026-03-18T08:15:00.000Z',
        },
        {
          id: 'scan_recent_003',
          websiteUrl: 'https://bestlawncare.com',
          leadEmail: null,
          status: 'analyzing',
          createdAt: '2026-03-18T07:45:00.000Z',
        },
        {
          id: 'scan_recent_004',
          websiteUrl: 'https://joesfitness.com',
          leadEmail: 'joe@joesfitness.com',
          status: 'completed',
          createdAt: '2026-03-17T22:10:00.000Z',
        },
        {
          id: 'scan_recent_005',
          websiteUrl: 'https://eliteauto.com',
          leadEmail: null,
          status: 'failed',
          createdAt: '2026-03-17T19:30:00.000Z',
        },
      ],
    };

    return NextResponse.json(mockResponse, { status: 200 });
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
