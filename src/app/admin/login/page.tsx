'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ApiError } from '../../../../contracts/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/admin';
  const forbidden = searchParams.get('error') === 'forbidden';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(forbidden ? 'Your account does not have admin access.' : null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as ApiError;
        setError(data.error.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141413]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-black tracking-tight text-[#F0EFE9]">FORGE</span>
          <span className="ml-2 rounded bg-forge-accent/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-forge-accent">
            Admin
          </span>
        </div>

        <div className="rounded-xl border border-[rgba(255,107,43,0.12)] bg-[#1E1E1C] p-8">
          <h1 className="mb-1 font-display text-xl font-bold tracking-tight text-[#F0EFE9]">
            Sign in
          </h1>
          <p className="mb-6 font-body text-sm text-[#9A9890]">Admin access only</p>

          {error && (
            <div className="mb-4 rounded-lg border border-forge-critical/20 bg-forge-critical/10 px-4 py-3">
              <p className="font-body text-sm text-forge-critical">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#282826] px-4 py-2.5 font-body text-sm text-[#F0EFE9] placeholder:text-[#9A9890]/40 focus:border-forge-accent/40 focus:outline-none"
                placeholder="admin@forgedigital.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9890]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-[rgba(255,107,43,0.12)] bg-[#282826] px-4 py-2.5 font-body text-sm text-[#F0EFE9] placeholder:text-[#9A9890]/40 focus:border-forge-accent/40 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-forge-accent px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-forge-accent-bright disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] text-[#9A9890]/50">
          audit.forgedigital.com
        </p>
      </div>
    </div>
  );
}
