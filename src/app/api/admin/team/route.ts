// /api/admin/team
// CRUD operations for admin team member management

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ApiError } from '@/../contracts/api';

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

// ---------- Schemas ----------

const createMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'closer', 'viewer']),
});

const updateMemberSchema = z.object({
  id: z.string().min(1, 'Member ID is required'),
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  role: z.enum(['admin', 'closer', 'viewer']).optional(),
  active: z.boolean().optional(),
});

const deleteMemberSchema = z.object({
  id: z.string().min(1, 'Member ID is required'),
});

// ---------- Mock Data ----------

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'team_001',
    email: 'admin@forgedigital.com',
    fullName: 'Adrian Trevino',
    role: 'admin',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'team_002',
    email: 'closer@forgedigital.com',
    fullName: 'Jamie Rivera',
    role: 'closer',
    active: true,
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-03-01T08:30:00.000Z',
  },
  {
    id: 'team_003',
    email: 'viewer@forgedigital.com',
    fullName: 'Alex Kim',
    role: 'viewer',
    active: false,
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-03-10T16:00:00.000Z',
  },
];

// ---------- GET: List team members ----------

export async function GET(): Promise<NextResponse<TeamListResponse | ApiError>> {
  try {
    // TODO: Verify admin authentication
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

// ---------- POST: Create team member ----------

export async function POST(request: NextRequest): Promise<NextResponse<TeamMemberResponse | ApiError>> {
  try {
    // TODO: Verify admin authentication

    const body: unknown = await request.json();
    const parsed = createMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid team member data',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // TODO: Create actual team member in Supabase Auth + database

    const now = new Date().toISOString();
    const mockMember: TeamMember = {
      id: `team_${crypto.randomUUID().slice(0, 8)}`,
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ member: mockMember }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to create team member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}

// ---------- PUT: Update team member ----------

export async function PUT(request: NextRequest): Promise<NextResponse<TeamMemberResponse | ApiError>> {
  try {
    // TODO: Verify admin authentication

    const body: unknown = await request.json();
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid update data',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // TODO: Update actual team member in Supabase

    const existing = MOCK_MEMBERS.find((m) => m.id === parsed.data.id);
    if (!existing) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Team member ${parsed.data.id} not found`,
          },
        },
        { status: 404 },
      );
    }

    const updatedMember: TeamMember = {
      ...existing,
      ...(parsed.data.email !== undefined && { email: parsed.data.email }),
      ...(parsed.data.fullName !== undefined && { fullName: parsed.data.fullName }),
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      ...(parsed.data.active !== undefined && { active: parsed.data.active }),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ member: updatedMember }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to update team member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}

// ---------- DELETE: Remove team member ----------

export async function DELETE(request: NextRequest): Promise<NextResponse<TeamDeleteResponse | ApiError>> {
  try {
    // TODO: Verify admin authentication

    const body: unknown = await request.json();
    const parsed = deleteMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid delete request',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // TODO: Soft-delete or remove team member from Supabase

    const existing = MOCK_MEMBERS.find((m) => m.id === parsed.data.id);
    if (!existing) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Team member ${parsed.data.id} not found`,
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ deleted: true, id: parsed.data.id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to delete team member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 },
    );
  }
}
