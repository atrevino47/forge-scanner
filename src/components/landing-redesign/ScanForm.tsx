'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Variant = 'hero' | 'cta-dark' | 'mobile';

interface ScanFormProps {
  variant?: Variant;
  buttonLabel?: string;
}

export function ScanForm({ variant = 'hero', buttonLabel = 'Scan my funnel →' }: ScanFormProps) {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter your website URL.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        let message = 'Something went wrong. Please try again.';
        try {
          const data = (await res.json()) as { error?: { message?: string } };
          if (data.error?.message) message = data.error.message;
        } catch {}
        setError(message);
        setSubmitting(false);
        return;
      }
      const data = (await res.json()) as { scanId: string };
      router.push(`/scan/${data.scanId}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (variant === 'cta-dark') {
    return (
      <form
        onSubmit={onSubmit}
        className="flex items-stretch gap-2.5 rounded-[10px] p-1.5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <input
          type="text"
          inputMode="url"
          placeholder="yourwebsite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={submitting}
          className="body flex-1 bg-transparent border-none outline-none px-4 h-[52px]"
          style={{ color: 'var(--ink-text)', fontSize: 15 }}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Starting…' : 'Scan →'}
        </button>
      </form>
    );
  }

  if (variant === 'mobile') {
    return (
      <form onSubmit={onSubmit}>
        <div
          className="flex items-center bg-white"
          style={{
            border: '1px solid var(--border-strong)',
            borderRadius: 10,
            height: 56,
            padding: '0 6px 0 14px',
          }}
        >
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            https://
          </span>
          <input
            type="text"
            inputMode="url"
            placeholder="yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={submitting}
            className="body flex-1 bg-transparent border-none outline-none ml-1.5"
            style={{ fontSize: 15, color: 'var(--text)' }}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full mt-2.5"
          style={{ height: 52 }}
          disabled={submitting}
        >
          {submitting ? 'Starting…' : buttonLabel}
        </button>
        {error && (
          <p className="mono mt-3" style={{ fontSize: 11, color: 'var(--critical)' }}>
            {error}
          </p>
        )}
      </form>
    );
  }

  // hero (desktop)
  return (
    <form onSubmit={onSubmit} className="max-w-[640px]">
      <div
        className="flex items-stretch bg-white"
        style={{
          border: '1px solid var(--border-strong)',
          borderRadius: 10,
          height: 64,
          padding: '0 4px 0 20px',
          gap: 10,
        }}
      >
        <span
          className="mono self-center"
          style={{ fontSize: 13, color: 'var(--text-muted)' }}
        >
          https://
        </span>
        <input
          type="text"
          inputMode="url"
          placeholder="yourwebsite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={submitting}
          className="body flex-1 bg-transparent border-none outline-none"
          style={{ fontSize: 17, color: 'var(--text)' }}
        />
        <button
          type="submit"
          className="btn btn-primary self-center"
          style={{ height: 52, fontSize: 14 }}
          disabled={submitting}
        >
          {submitting ? 'Starting…' : buttonLabel}
        </button>
      </div>
      {error && (
        <p className="mono mt-3" style={{ fontSize: 11, color: 'var(--critical)' }}>
          {error}
        </p>
      )}
    </form>
  );
}
