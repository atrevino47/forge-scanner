// /api/admin/team
// CRUD operations for admin team member management

import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/../contracts/api';
import { requireAdminSession } from '@/lib/auth/admin';

// ---------- Shared Types ----------

interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'closer' | 'viewer';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeamListResponse {
  members: TeamMember[];
  total: number;
}

interface TeamMemberResponse {
  member: TeamMember;
}

interface TeamDeleteResponse {
  deleted: true;
  id: string;
}

// ---------- Mock Data (GET only) ----------

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'team_001',
    email: 'admin@forgewith.ai',
    fullName: 'Adrian Trevino',
    role: 'admin',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

// ---------- GET: List team members ----------

export async function GET(request: NextRequest): Promise<NextResponse<TeamListResponse | ApiError>> {
  try {
    const authError = await requireAdminSession(request);
    if (authError) return authError as NextResponse<ApiError>;

    // TODO: Query actual team members from Supabase
    const mockResponse: TeamListResponse = {
      members: MOCK_MEMBERS,
      total: MOCK_MEMBERS.length,
    };

    return NextResponse.json(mockResponse, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch team members',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}

// ---------- POST / PUT / DELETE: Not yet implemented ----------
// Returning 501 so callers get an honest error instead of silent mock success.

export async function POST(request: NextRequest): Promise<NextResponse<ApiError>> {
  const authError = await requireAdminSession(request);
  if (authError) return authError as NextResponse<ApiError>;
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Team management is not yet implemented.' } },
    { status: 501 },
  );
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiError>> {
  const authError = await requireAdminSession(request);
  if (authError) return authError as NextResponse<ApiError>;
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Team management is not yet implemented.' } },
    { status: 501 },
  );
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiError>> {
  const authError = await requireAdminSession(request);
  if (authError) return authError as NextResponse<ApiError>;
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Team management is not yet implemented.' } },
    { status: 501 },
  );
}
