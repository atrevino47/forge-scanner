import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CaptureInfoResponse, ApiError } from '@/../contracts/api';
import type { DetectedSocials } from '@/../contracts/types';
import { createServiceClient } from '@/lib/db/client';
import { dbLeadToLead } from '@/lib/db/mappers';
import type { DbLead } from '@/lib/db/types';
import { apiError } from '@/lib/api-utils';
import { writeVaultEvent } from '@/lib/vault/event-writer';

// ============================================================
// POST /api/scan/capture-info
// Captures lead contact info (email, phone, name, socials)
// during or after the scan flow.
// ============================================================

const ProvidedSocialsSchema = z
  .object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    linkedin: z.string().optional(),
  })
  .optional();

const SocialConfirmationSchema = z
  .object({
    platform: z.string().min(1),
    confirmedHandle: z.string().min(1),
  })
  .optional();

const CaptureInfoSchema = z.object({
  scanId: z.string().min(1, 'Scan ID is required'),
  leadId: z.string().min(1, 'Lead ID is required'),
  email: z.string().email('Must be a valid email address').optional(),
  phone: z.string().optional(),
  fullName: z.string().optional(),
  businessName: z.string().optional(),
  providedSocials: ProvidedSocialsSchema,
  socialConfirmation: SocialConfirmationSchema,
}).refine(
  (data) => data.email || data.socialConfirmation,
  { message: 'Either email or socialConfirmation must be provided' }
);

export async function POST(
  request: NextRequest
): Promise<NextResponse<CaptureInfoResponse | ApiError>> {
  try {
    // (a) Parse and validate body
    const body: unknown = await request.json();

    const parsed = CaptureInfoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message:
              parsed.error.issues[0]?.message ?? 'Invalid request body',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      scanId,
      leadId,
      email,
      phone,
      fullName,
      businessName,
      providedSocials,
      socialConfirmation,
    } = parsed.data;

    const supabase = createServiceClient();

    // (b) Verify the scan exists
    const { data: scan, error: scanFetchError } = await supabase
      .from('scans')
      .select('id, lead_id, detected_socials')
      .eq('id', scanId)
      .single();

    if (scanFetchError || !scan) {
      return apiError(
        'NOT_FOUND',
        'Scan not found. It may have expired or does not exist.',
        404
      );
    }

    // (c) Update lead record with provided info
    const updateData: Record<string, string> = {
      capture_method: 'direct',
      ...(email && { email }),
      ...(phone && { phone }),
      ...(fullName && { full_name: fullName }),
      ...(businessName && { business_name: businessName }),
    };

    const { error: leadUpdateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId);

    if (leadUpdateError) {
      console.error(
        '[scan/capture-info] Failed to update lead:',
        leadUpdateError
      );
      return apiError(
        'INTERNAL',
        'Failed to save your information. Please try again.',
        500
      );
    }

    writeVaultEvent({
      type: 'lead_captured',
      scanId: parsed.data.scanId,
      leadEmail: parsed.data.email,
      leadPhone: parsed.data.phone,
      businessName: parsed.data.businessName,
      details: { captureMethod: 'direct' },
    });

    // (d) If providedSocials is present, update scans.provided_socials
    if (providedSocials) {
      const { error: socialsUpdateError } = await supabase
        .from('scans')
        .update({ provided_socials: providedSocials })
        .eq('id', scanId);

      if (socialsUpdateError) {
        console.error(
          '[scan/capture-info] Failed to update provided_socials:',
          socialsUpdateError
        );
        // Non-critical — continue
      }
    }

    // (e) If socialConfirmation is present, update detected_socials
    if (socialConfirmation) {
      const existingDetected = (scan.detected_socials ?? {}) as DetectedSocials;
      const platform = socialConfirmation.platform as keyof DetectedSocials;

      const updatedDetected: DetectedSocials = {
        ...existingDetected,
        [platform]: {
          handle: socialConfirmation.confirmedHandle,
          url: existingDetected[platform]?.url ?? '',
          confidence: 'high' as const,
        },
      };

      const { error: detectedUpdateError } = await supabase
        .from('scans')
        .update({ detected_socials: updatedDetected })
        .eq('id', scanId);

      if (detectedUpdateError) {
        console.error(
          '[scan/capture-info] Failed to update detected_socials:',
          detectedUpdateError
        );
        // Non-critical — continue
      }
    }

    // (f) Fetch the updated lead from DB
    const { data: updatedLead, error: leadFetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadFetchError || !updatedLead) {
      console.error(
        '[scan/capture-info] Failed to fetch updated lead:',
        leadFetchError
      );
      return apiError(
        'INTERNAL',
        'Failed to retrieve updated information. Please try again.',
        500
      );
    }

    // (g) Convert DB row to contract Lead type and return
    const lead = dbLeadToLead(updatedLead as DbLead);

    console.log(
      `[scan/capture-info] Captured info for scanId=${scanId}, lead=${leadId}, hasEmail=${!!email}`
    );

    const response: CaptureInfoResponse = {
      success: true,
      lead,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('[scan/capture-info] Unexpected error:', err);
    return apiError(
      'INTERNAL',
      'Failed to save your information. Please try again.',
      500,
      process.env.NODE_ENV === 'development' ? String(err) : undefined
    );
  }
}
