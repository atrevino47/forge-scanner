import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { LinkScanResponse, ApiError } from '@/../contracts/api';

// ============================================================
// POST /api/auth/link-scan
// Associates an anonymous scan with an authenticated user.
// Called after the user signs in via OAuth to claim their scan results.
// ============================================================

const LinkScanSchema = z.object({
  scanId: z.string().min(1, 'Scan ID is required'),
});

export async function POST(request: NextRequest): Promise<NextResponse<LinkScanResponse | ApiError>> {
  try {
    const body: unknown = await request.json();

    const parsed = LinkScanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: parsed.error.issues[0]?.message ?? 'Invalid request body',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { scanId } = parsed.data;

    // --- MOCK: Replace with real user lookup from Supabase auth + scan linkage ---
    const mockUserId = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

    console.log(`[auth/link-scan] Linked scanId=${scanId} to userId=${mockUserId}`);

    const response: LinkScanResponse = {
      success: true,
      userId: mockUserId,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('[auth/link-scan] Unexpected error:', err);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to link scan to your account. Please try again.',
          details: process.env.NODE_ENV === 'development' ? String(err) : undefined,
        },
      },
      { status: 500 }
    );
  }
}
