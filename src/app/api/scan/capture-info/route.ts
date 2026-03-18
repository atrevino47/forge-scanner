import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CaptureInfoResponse, ApiError } from '@/../contracts/api';
import type { Lead, DetectedSocials } from '@/../contracts/types';
import { createServiceClient } from '@/lib/db/client';
import { apiError } from '@/lib/api-utils';

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
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
  phone: z.string().optional(),
  fullName: z.string().optional(),
  businessName: z.string().optional(),
  providedSocials: ProvidedSocialsSchema,
  socialConfirmation: SocialConfirmationSchema,
});

/**
 * Shape of a lead row as returned from the `leads` table (snake_case).
 */
interface LeadRow {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  website_url: string;
  business_name: string | null;
  source: 'organic' | 'outreach' | 'ad';
  capture_method: 'direct' | 'scraped' | 'manual' | null;
  created_at: string;
  updated_at: string;
}

/**
 * Convert a snake_case DB lead row to the camelCase Lead contract type.
 */
function toContractLead(row: LeadRow): Lead {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    fullName: row.full_name,
    websiteUrl: row.website_url,
    businessName: row.business_name,
    source: row.source,
    captureMethod: row.capture_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
      email,
      capture_method: 'direct',
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
    const lead = toContractLead(updatedLead as LeadRow);

    console.log(
      `[scan/capture-info] Captured info for scanId=${scanId}, lead=${leadId}, email=${email}`
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
