// Regression tests for SSRF denylist (audit item 1.2).
// Any hostname that would give the Hetzner Chrome access to internal
// infrastructure or cloud metadata must return true.

import { describe, it, expect } from 'vitest';
import { isPrivateOrMetadataHost } from './ssrf';

describe('isPrivateOrMetadataHost', () => {
  it.each([
    'localhost',
    'LOCALHOST',
    'metadata.google.internal',
    'foo.local',
    'svc.internal',
    'x.test',
    '127.0.0.1',
    '127.255.255.254',
    '0.0.0.0',
    '10.0.0.1',
    '10.255.255.255',
    '172.16.0.1',
    '172.20.10.5',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // AWS/GCP metadata
    '169.254.0.1',
    '::1',
    '0:0:0:0:0:0:0:1',
    '[::1]',
    'fc00::1',
    'fd12:3456:789a::1',
  ])('blocks %s', (host) => {
    expect(isPrivateOrMetadataHost(host)).toBe(true);
  });

  it.each([
    'forgewith.ai',
    'google.com',
    'example.com',
    '8.8.8.8',
    '1.1.1.1',
    '172.15.0.1', // outside 172.16/12
    '172.32.0.1', // outside 172.16/12
    '169.253.0.1', // outside 169.254/16
    '2606:4700:4700::1111', // public IPv6 (Cloudflare)
  ])('allows %s', (host) => {
    expect(isPrivateOrMetadataHost(host)).toBe(false);
  });
});
