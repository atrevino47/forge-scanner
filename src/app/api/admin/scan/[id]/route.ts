// GET /api/admin/scan/[id]
// Returns full scan details for admin team view (used during strategy calls)

import { NextRequest, NextResponse } from 'next/server';
import type { ScanResultsResponse, ApiError } from '@/../contracts/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ScanResultsResponse | ApiError>> {
  try {
    // TODO: Verify admin authentication

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Scan ID is required',
          },
        },
        { status: 400 },
      );
    }

    // TODO: Fetch actual scan from Supabase with full details

    const mockResponse: ScanResultsResponse = {
      scan: {
        id,
        websiteUrl: 'https://acmeplumbing.com',
        status: 'completed',
        detectedSocials: {
          instagram: { handle: 'acmeplumbing', url: 'https://instagram.com/acmeplumbing', confidence: 'high' },
          facebook: { handle: 'AcmePlumbing', url: 'https://facebook.com/AcmePlumbing', confidence: 'high' },
        },
        providedSocials: null,
        stages: [
          {
            stage: 'traffic',
            status: 'completed',
            summary: {
              exists: true,
              score: 45,
              headline: '[COPY: Traffic stage headline for acmeplumbing]',
              findings: [
                {
                  id: 'finding_001',
                  title: '[COPY: Inconsistent posting schedule]',
                  detail: '[COPY: Detail about posting frequency impact]',
                  type: 'warning',
                  impact: 'high',
                },
              ],
            },
            screenshots: [],
            startedAt: '2026-03-15T10:30:00.000Z',
            completedAt: '2026-03-15T10:31:15.000Z',
          },
          {
            stage: 'landing',
            status: 'completed',
            summary: {
              exists: true,
              score: 62,
              headline: '[COPY: Landing stage headline for acmeplumbing]',
              findings: [
                {
                  id: 'finding_002',
                  title: '[COPY: No clear CTA above fold]',
                  detail: '[COPY: Detail about CTA placement impact]',
                  type: 'critical',
                  impact: 'high',
                },
                {
                  id: 'finding_003',
                  title: '[COPY: Missing trust signals]',
                  detail: '[COPY: Detail about trust signal impact]',
                  type: 'warning',
                  impact: 'medium',
                },
              ],
            },
            screenshots: [],
            startedAt: '2026-03-15T10:30:05.000Z',
            completedAt: '2026-03-15T10:31:45.000Z',
          },
          {
            stage: 'capture',
            status: 'completed',
            summary: {
              exists: false,
              score: 15,
              headline: '[COPY: No lead capture mechanism detected]',
              findings: [
                {
                  id: 'finding_004',
                  title: '[COPY: No lead magnet or opt-in]',
                  detail: '[COPY: Detail about missing lead capture]',
                  type: 'critical',
                  impact: 'high',
                },
              ],
            },
            screenshots: [],
            startedAt: '2026-03-15T10:30:10.000Z',
            completedAt: '2026-03-15T10:31:30.000Z',
          },
          {
            stage: 'offer',
            status: 'completed',
            summary: {
              exists: true,
              score: 55,
              headline: '[COPY: Offer presentation needs improvement]',
              findings: [],
            },
            screenshots: [],
            startedAt: '2026-03-15T10:30:15.000Z',
            completedAt: '2026-03-15T10:31:50.000Z',
          },
          {
            stage: 'followup',
            status: 'completed',
            summary: {
              exists: false,
              score: 0,
              headline: '[COPY: No automated follow-up detected]',
              findings: [
                {
                  id: 'finding_005',
                  title: '[COPY: No email sequence]',
                  detail: '[COPY: Detail about missing follow-up impact]',
                  type: 'critical',
                  impact: 'high',
                },
              ],
            },
            screenshots: [],
            startedAt: '2026-03-15T10:30:20.000Z',
            completedAt: '2026-03-15T10:31:55.000Z',
          },
        ],
        completedAt: '2026-03-15T10:32:00.000Z',
        createdAt: '2026-03-15T10:30:00.000Z',
      },
      lead: {
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
      },
      blueprintAvailable: true,
      blueprintId: 'bp_mock_001',
    };

    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch scan details',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
