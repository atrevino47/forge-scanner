// GET /api/workbook/mine?locale=en&type=branding
// Returns the authenticated user's workbook for the given locale + type

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/config';
import { createServiceClient } from '@/lib/db/client';
import type { ApiError } from '@/../contracts/api';

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { user } = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } satisfies ApiError,
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') ?? 'en';
    const typeParam = url.searchParams.get('type');
    const type = typeParam === 'offers' ? 'offers' : 'branding';
    const supabase = createServiceClient();

    const { data } = await supabase
      .from('workbook_submissions')
      .select('id, answers, completed_count, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('locale', locale)
      .eq('type', type)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ id: null, answers: null });
    }

    return NextResponse.json({
      id: data.id,
      answers: data.answers as Record<string, string>,
      completedCount: data.completed_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Unexpected error' } } satisfies ApiError,
      { status: 500 },
    );
  }
}
