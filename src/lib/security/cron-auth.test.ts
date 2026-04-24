// Regression tests for timing-safe cron secret comparison (audit item 1.5).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyCronSecret } from './cron-auth';

describe('verifyCronSecret', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-12345';
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it('accepts the correct bearer token', () => {
    expect(verifyCronSecret('Bearer test-secret-12345')).toBe(true);
  });

  it('rejects a wrong token of equal length', () => {
    expect(verifyCronSecret('Bearer test-secret-XXXXX')).toBe(false);
  });

  it('rejects a token that is a prefix of the secret', () => {
    expect(verifyCronSecret('Bearer test')).toBe(false);
  });

  it('rejects a token that extends the secret', () => {
    expect(verifyCronSecret('Bearer test-secret-12345-extra')).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(verifyCronSecret(null)).toBe(false);
  });

  it('rejects an empty header', () => {
    expect(verifyCronSecret('')).toBe(false);
  });

  it('rejects when CRON_SECRET is unset', () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronSecret('Bearer anything')).toBe(false);
  });

  it('rejects a token missing the Bearer prefix', () => {
    expect(verifyCronSecret('test-secret-12345')).toBe(false);
  });
});
