// src/lib/security/cron-auth.ts
// Timing-safe authorization helper for cron routes.
//
// Direct string equality (`a === b`) short-circuits on the first mismatched
// byte, leaking secret length + prefix to a sufficiently patient attacker.
// `crypto.timingSafeEqual` compares in constant time over equal-length buffers.
// We pad both sides to the longer length so a length mismatch does not itself
// leak via branch timing.

import { timingSafeEqual } from 'node:crypto';

export function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (!authHeader) return false;

  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);

  // Pad to equal length so timingSafeEqual doesn't throw, then compare.
  // Final `a.length === b.length` check prevents equal-prefix-of-different-length
  // collisions (the pad would otherwise make "abc" === "abc\0" look true).
  const len = Math.max(a.length, b.length);
  const aPadded = Buffer.alloc(len);
  const bPadded = Buffer.alloc(len);
  a.copy(aPadded);
  b.copy(bPadded);

  return timingSafeEqual(aPadded, bPadded) && a.length === b.length;
}
