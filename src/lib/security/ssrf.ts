// src/lib/security/ssrf.ts
// SSRF denylist for user-supplied scan URLs. Blocks loopback, RFC1918,
// link-local (incl. AWS/GCP metadata), IPv6 loopback + unique-local,
// and common internal-only TLDs (.local, .internal, .test).
//
// Static hostname/IP check only — no DNS resolution. DNS rebinding is
// a separate defense we don't currently mount; mitigated by Hetzner
// egress firewall rules.

export function isPrivateOrMetadataHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  const blocked = ['localhost', 'metadata.google.internal'];
  if (blocked.includes(h)) return true;
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.test')) return true;

  // IPv6 loopback / unique-local (fc00::/7)
  if (h === '::1' || h === '0:0:0:0:0:0:0:1') return true;
  if (/^f[cd]/i.test(h)) return true;

  // IPv4 literal check
  const parts = h.split('.');
  if (parts.length === 4) {
    const nums = parts.map(Number);
    if (nums.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      const [a, b] = nums;
      if (a === 0) return true;            // 0.0.0.0/8
      if (a === 10) return true;           // 10.0.0.0/8
      if (a === 127) return true;          // 127.0.0.0/8 loopback
      if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / AWS metadata
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true; // 192.168.0.0/16
    }
  }

  return false;
}
