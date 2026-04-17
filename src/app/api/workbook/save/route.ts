// POST /api/workbook/save
// Public endpoint — saves or updates a workbook submission.
// If the request carries a valid Supabase session, links the row to the user.
// Supports multiple workbook types (branding, offers) via `type` field.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/db/client';
import { getUser } from '@/lib/auth/config';
import type { SaveWorkbookResponse, ApiError } from '@/../contracts/api';

// Legacy branding field list — used when client doesn't send completedCount/totalFields
const BRANDING_FIELDS = [
  'catalyst', 'coreTruth', 'proof',
  'originStory', 'failureStory', 'successStory', 'clientStory', 'industryStory',
  'idealClient', 'services', 'freeResources', 'voiceIdentity',
] as const;

const bodySchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['branding', 'offers']).optional(),
  clientName: z.string().max(200).optional(),
  businessName: z.string().max(200).optional(),
  locale: z.string().max(5).optional(),
  answers: z.record(z.string(), z.string()),
  completedCount: z.number().int().nonnegative().optional(),
  totalFields: z.number().int().positive().max(200).optional(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<SaveWorkbookResponse | ApiError>> {
  try {
    const body: unknown = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid request body', details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const { id, type, clientName, businessName, locale, answers, completedCount, totalFields } = parsed.data;
    const workbookType = type ?? 'branding';

    // Client sends counts for its own field set; fall back to branding legacy if absent
    const computedCompleted = completedCount ?? BRANDING_FIELDS.filter(
      (f) => (answers[f as string] || '').trim().length > 0
    ).length;
    const computedTotal = totalFields ?? BRANDING_FIELDS.length;

    // Check if user is authenticated — link row to their account
    let userId: string | null = null;
    try {
      const { user } = await getUser(request);
      if (user) userId = user.id;
    } catch {
      // Not authenticated — continue as anonymous
    }

    const supabase = createServiceClient();

    if (id) {
      // Update existing row
      const updatePayload: Record<string, unknown> = {
        type: workbookType,
        client_name: clientName ?? null,
        business_name: businessName ?? null,
        locale: locale ?? 'en',
        answers,
        completed_count: computedCompleted,
        total_fields: computedTotal,
        updated_at: new Date().toISOString(),
      };
      // Claim unclaimed row for authenticated user
      if (userId) updatePayload.user_id = userId;

      const { error } = await supabase
        .from('workbook_submissions')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        return NextResponse.json(
          { error: { code: 'DB_ERROR', message: 'Failed to update workbook', details: error.message } },
          { status: 500 },
        );
      }

      return NextResponse.json({ id, savedAt: new Date().toISOString() });
    }

    // Create new row
    const insertPayload: Record<string, unknown> = {
      type: workbookType,
      client_name: clientName ?? null,
      business_name: businessName ?? null,
      locale: locale ?? 'en',
      answers,
      completed_count: computedCompleted,
      total_fields: computedTotal,
    };
    if (userId) insertPayload.user_id = userId;

    const { data, error } = await supabase
      .from('workbook_submissions')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Failed to save workbook', details: error?.message } },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id, savedAt: new Date().toISOString() }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Unexpected error saving workbook' } },
      { status: 500 },
    );
  }
}
