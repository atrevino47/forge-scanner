'use client';

import { useState } from 'react';
import { revenueAuditCopy as copy } from '@/lib/copy/revenue-audit';
import { useAuth } from '@/components/providers/SupabaseProvider';

interface Props {
  scanId: string;
  leadId: string;
  onCaptured: (email: string) => void;
}

export function EmailGate({ scanId, leadId, onCaptured }: Props) {
  const { signInWithMagicLink, signUpWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      setError('Email required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await fetch('/api/scan/capture-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, leadId, email: email.trim() }),
      });

      const authResult =
        showPassword && password
          ? await signUpWithPassword(email.trim(), password)
          : await signInWithMagicLink(email.trim());

      if (authResult.error) {
        setError(authResult.error);
        return;
      }

      if (!showPassword) setSent(true);
      onCaptured(email.trim());
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <section className="px-6 py-16 max-w-md mx-auto text-center">
        <h2 className="font-display text-2xl text-forge-text mb-3">
          {copy.emailGate.checkEmail}
        </h2>
        <p className="text-forge-text-secondary">
          Results continue loading below while you check.
        </p>
      </section>
    );
  }

  return (
    <section className="px-6 py-16 max-w-md mx-auto">
      <h2 className="font-display text-2xl md:text-3xl text-forge-text mb-2">
        {copy.emailGate.headline}
      </h2>
      <p className="text-forge-text-secondary mb-6">{copy.emailGate.body}</p>

      <label className="block mb-3">
        <span className="sr-only">Email</span>
        <input
          type="email"
          className="w-full rounded-lg border border-forge-card bg-forge-base px-4 py-3 text-forge-text"
          placeholder={copy.emailGate.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      {showPassword && (
        <label className="block mb-3">
          <span className="sr-only">Password</span>
          <input
            type="password"
            className="w-full rounded-lg border border-forge-card bg-forge-base px-4 py-3 text-forge-text"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="text-xs text-forge-text-secondary underline mb-6 block"
      >
        {showPassword ? copy.emailGate.passwordRemove : copy.emailGate.passwordAdd}
      </button>

      {error && (
        <p className="text-sm text-forge-critical mb-4" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="w-full px-5 py-3 rounded-lg bg-forge-accent text-white font-semibold"
      >
        {submitting
          ? 'Working…'
          : showPassword
            ? copy.emailGate.submitPassword
            : copy.emailGate.submitMagicLink}
      </button>
    </section>
  );
}
