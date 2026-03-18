// GET /api/health
// Health check endpoint for monitoring and uptime checks

import { NextResponse } from 'next/server';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  // TODO: Check Supabase connectivity
  // TODO: Check external service availability (Stripe, Resend, etc.)
  // TODO: Return 'degraded' if non-critical services are down

  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  };

  return NextResponse.json(response, { status: 200 });
}
