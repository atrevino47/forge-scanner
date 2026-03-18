// GET /api/admin/leads
// Returns paginated lead list for admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { AdminLeadsResponse, ApiError } from '@/../contracts/api';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['all', 'has_email', 'no_email', 'booked', 'converted']).default('all'),
  source: z.enum(['organic', 'outreach', 'ad']).optional(),
  sortBy: z.enum(['created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest): Promise<NextResponse<AdminLeadsResponse | ApiError>> {
  try {
    // TODO: Verify admin authentication

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
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

    // TODO: Query actual leads from Supabase with pagination and filters

    const mockResponse: AdminLeadsResponse = {
      leads: [
        {
          id: 'lead_mock_001',
          email: 'sarah@acmeplumbing.com',
          phone: '+15551234567',
          fullName: 'Sarah Johnson',
          websiteUrl: 'https://acmeplumbing.com',
          businessName: 'Acme Plumbing',
          source: 'organic',
          captureMethod: 'direct',
          createdAt: '2026-03-15T10:30:00.000Z',
          updatedAt: '2026-03-15T14:22:00.000Z',
          scanCount: 2,
          latestScanId: 'scan_mock_001',
          hasBooked: true,
          hasPaid: false,
        },
        {
          id: 'lead_mock_002',
          email: 'mike@sunsetdental.com',
          phone: null,
          fullName: 'Mike Chen',
          websiteUrl: 'https://sunsetdental.com',
          businessName: 'Sunset Dental',
          source: 'ad',
          captureMethod: 'direct',
          createdAt: '2026-03-16T08:15:00.000Z',
          updatedAt: '2026-03-16T08:15:00.000Z',
          scanCount: 1,
          latestScanId: 'scan_mock_002',
          hasBooked: false,
          hasPaid: false,
        },
        {
          id: 'lead_mock_003',
          email: null,
          phone: null,
          fullName: null,
          websiteUrl: 'https://bestlawncare.com',
          businessName: null,
          source: 'organic',
          captureMethod: null,
          createdAt: '2026-03-17T16:45:00.000Z',
          updatedAt: '2026-03-17T16:45:00.000Z',
          scanCount: 1,
          latestScanId: 'scan_mock_003',
          hasBooked: false,
          hasPaid: false,
        },
      ],
      total: 3,
      page: parsed.data.page,
      limit: parsed.data.limit,
    };

    return NextResponse.json(mockResponse, { status: 200 });
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
