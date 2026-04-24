// src/lib/rate-limit/index.ts
// Rate limiting utility backed by the rate_limits table.
//
// Uses the `check_rate_limit` Postgres RPC (migration 20260424010000) to
// perform the read-modify-write as a single atomic statement. The previous
// implementation performed a SELECT then UPDATE from app code, which allowed
// two concurrent requests to both observe count=limit and both increment —
// bursting through the cap. The RPC closes that race.

import { createServiceClient } from '@/lib/db/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

type RateLimitType = 'ip_scan' | 'email_scan' | 'ip_api';

interface RpcRow {
  allowed: boolean;
  new_count: number;
  window_start: string;
}

export async function checkRateLimit(
  key: string,
  type: RateLimitType,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_type: type,
    p_limit: limit,
    p_window_ms: windowMs,
  });

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? (data[0] as RpcRow | undefined) : (data as RpcRow | null);
  if (!row) {
    throw new Error('Rate limit check returned no row');
  }

  const windowStartMs = new Date(row.window_start).getTime();
  const resetAt = new Date(windowStartMs + windowMs).toISOString();
  const remaining = Math.max(0, limit - row.new_count);

  return {
    allowed: row.allowed,
    remaining,
    resetAt,
  };
}
