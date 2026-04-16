'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/components/providers/SupabaseProvider';

const i18n = {
  en: {
    saveProgress: 'Save your progress',
    welcomeBack: 'Welcome back',
    createDesc: 'Create an account to access your workbook from any device.',
    loginDesc: 'Sign in to load your saved workbook.',
    email: 'Email',
    password: 'Password (min 6 chars)',
    createAccount: 'Create Account',
    signIn: 'Sign In',
    checkEmail: 'Check your email to confirm your account.',
    alreadyHave: 'Already have an account? Sign in',
    needAccount: 'Need an account? Create one',
    signedInAs: 'Signed in as',
    signOut: 'Sign out',
  },
  es: {
    saveProgress: 'Guarda tu progreso',
    welcomeBack: 'Bienvenido de vuelta',
    createDesc: 'Crea una cuenta para acceder a tu workbook desde cualquier dispositivo.',
    loginDesc: 'Inicia sesión para cargar tu workbook guardado.',
    email: 'Correo electrónico',
    password: 'Contraseña (mín 6 caracteres)',
    createAccount: 'Crear Cuenta',
    signIn: 'Iniciar Sesión',
    checkEmail: 'Revisa tu correo para confirmar tu cuenta.',
    alreadyHave: '¿Ya tienes cuenta? Inicia sesión',
    needAccount: '¿No tienes cuenta? Crea una',
    signedInAs: 'Sesión iniciada como',
    signOut: 'Cerrar sesión',
  },
} as const;

export function WorkbookAuth({ onAuth, locale = 'en' }: { onAuth?: () => void; locale?: 'en' | 'es' }) {
  const { supabase, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const t = i18n[locale] ?? i18n.en;

  /* ── Logged-in state ── */
  if (user) {
    return (
      <div className="print:hidden mb-10 flex items-center justify-between rounded-xl border border-forge-positive/20 bg-forge-positive/5 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forge-positive/20 text-forge-positive text-xs">
            &#10003;
          </span>
          <span className="font-body text-[14px] text-forge-text">
            {t.signedInAs} <strong className="font-semibold">{user.email}</strong>
          </span>
        </div>
        <button
          onClick={async () => { await supabase.auth.signOut(); }}
          className="rounded-lg px-3 py-1.5 font-body text-[12px] text-forge-text-muted hover:bg-forge-card hover:text-forge-text transition-colors"
        >
          {t.signOut}
        </button>
      </div>
    );
  }

  /* ── Auth form ── */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === 'register') {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      setSuccess(t.checkEmail);
      setLoading(false);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      setLoading(false);
      onAuth?.();
    }
  };

  return (
    <div className="print:hidden mb-10 rounded-xl border border-forge-border bg-forge-surface/40 px-6 py-5">
      <div className="mb-4">
        <h3 className="font-display text-[16px] font-semibold text-forge-text">
          {mode === 'register' ? t.saveProgress : t.welcomeBack}
        </h3>
        <p className="font-body text-[13px] text-forge-text-secondary mt-0.5">
          {mode === 'register' ? t.createDesc : t.loginDesc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email} required
          className="flex-1 rounded-lg border border-forge-elevated bg-forge-card px-4 py-2.5
            font-body text-[14px] text-forge-text placeholder:text-forge-text-muted/60
            focus:border-forge-accent/30 focus:outline-none focus:ring-2 focus:ring-forge-accent/10
            transition-all duration-200"
        />
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder={t.password} required minLength={6}
          className="flex-1 rounded-lg border border-forge-elevated bg-forge-card px-4 py-2.5
            font-body text-[14px] text-forge-text placeholder:text-forge-text-muted/60
            focus:border-forge-accent/30 focus:outline-none focus:ring-2 focus:ring-forge-accent/10
            transition-all duration-200"
        />
        <button
          type="submit" disabled={loading}
          className="rounded-lg bg-forge-accent px-5 py-2.5 font-body text-[13px] font-semibold text-white
            hover:bg-forge-accent-bright transition-colors duration-150
            disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? '...' : mode === 'register' ? t.createAccount : t.signIn}
        </button>
      </form>

      {error && <p className="mt-3 font-body text-[13px] text-forge-critical">{error}</p>}
      {success && <p className="mt-3 font-body text-[13px] text-forge-positive">{success}</p>}

      <button
        type="button"
        onClick={() => { setMode((m) => (m === 'register' ? 'login' : 'register')); setError(null); setSuccess(null); }}
        className="mt-3 font-body text-[12px] text-forge-text-muted hover:text-forge-text transition-colors"
      >
        {mode === 'register' ? t.alreadyHave : t.needAccount}
      </button>
    </div>
  );
}
