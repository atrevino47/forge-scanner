import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { LinkScanResponse, ApiError } from '@/../contracts/api';
import { getUser } from '@/lib/auth/config';
import { createServiceClient } from '@/lib/db/client';

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

    // Get authenticated user from session
    const { user } = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const db = createServiceClient();

    // Ensure user exists in users table (upsert from auth.users)
    await db.from('users').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: 'user',
      },
      { onConflict: 'id' },
    );

    // Link the scan to this user
    const { error: scanError } = await db
      .from('scans')
      .update({ user_id: user.id })
      .eq('id', scanId);

    if (scanError) {
      console.error(`[auth/link-scan] Failed to link scan ${scanId}:`, scanError);
      return NextResponse.json(
        { error: { code: 'INTERNAL', message: 'Failed to link scan' } },
        { status: 500 },
      );
    }

    // Also link user to the lead via the scan's lead_id
    const { data: scan } = await db
      .from('scans')
      .select('lead_id')
      .eq('id', scanId)
      .single();

    if (scan?.lead_id) {
      await db.from('users').update({ lead_id: scan.lead_id }).eq('id', user.id);
    }

    console.log(`[auth/link-scan] Linked scanId=${scanId} to userId=${user.id}`);

    return NextResponse.json({ success: true, userId: user.id }, { status: 200 });
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
