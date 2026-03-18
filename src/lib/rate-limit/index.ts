// src/lib/rate-limit/index.ts
// Rate limiting utility backed by the rate_limits table

import { createServiceClient } from '@/lib/db/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

type RateLimitType = 'ip_scan' | 'email_scan' | 'ip_api';

/**
 * Check and increment a rate limit counter.
 *
 * @param key      - Unique identifier (e.g., IP address or email)
 * @param type     - Category of rate limit
 * @param limit    - Maximum allowed requests in the window
 * @param windowMs - Window duration in milliseconds
 *
 * Uses an upsert pattern: if a record exists within the current window,
 * increment the count. If the window has expired, reset the counter.
 */
export async function checkRateLimit(
  key: string,
  type: RateLimitType,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const supabase = createServiceClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Fetch existing record for this key + type
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('id, count, window_start')
    .eq('key', key)
    .eq('type', type)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine
    throw new Error(`Rate limit check failed: ${fetchError.message}`);
  }

  // If a record exists and is still within the window, increment
  if (existing && new Date(existing.window_start) > windowStart) {
    const newCount = existing.count + 1;
    const resetAt = new Date(
      new Date(existing.window_start).getTime() + windowMs
    ).toISOString();

    if (newCount > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ count: newCount })
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Rate limit update failed: ${updateError.message}`);
    }

    return {
      allowed: true,
      remaining: limit - newCount,
      resetAt,
    };
  }

  // No record or window expired — upsert with count = 1, fresh window
  const resetAt = new Date(now.getTime() + windowMs).toISOString();

  if (existing) {
    // Window expired, reset the counter
    const { error: resetError } = await supabase
      .from('rate_limits')
      .update({
        count: 1,
        window_start: now.toISOString(),
      })
      .eq('id', existing.id);

    if (resetError) {
      throw new Error(`Rate limit reset failed: ${resetError.message}`);
    }
  } else {
    // First request, insert new record
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        key,
        type,
        count: 1,
        window_start: now.toISOString(),
      });

    if (insertError) {
      throw new Error(`Rate limit insert failed: ${insertError.message}`);
    }
  }

  return {
    allowed: true,
    remaining: limit - 1,
    resetAt,
  };
}
