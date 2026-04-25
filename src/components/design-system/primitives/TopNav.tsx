'use client';

import { ForgeLogo } from './ForgeLogo';

interface TopNavProps {
  dark?: boolean;
  ctaLabel?: string;
  onCta?: () => void;
  compact?: boolean;
}

export function TopNav({
  dark = false,
  ctaLabel = 'Scan my funnel',
  onCta,
  compact = false,
}: TopNavProps) {
  return (
    <header
      className={
        'top-nav' +
        (dark ? ' top-nav-dark' : '') +
        (compact ? ' top-nav-compact' : '')
      }
    >
      <ForgeLogo dark={dark} size={compact ? 16 : 18} />
      <nav className="top-nav-links">
        <a className="top-nav-link mono" href="#how-it-works">
          How it works
        </a>
        <a className="top-nav-link mono" href="/offer">
          Offer
        </a>
        <a className="top-nav-link mono" href="#faq">
          FAQ
        </a>
        <button
          type="button"
          className={'btn btn-sm ' + (dark ? 'btn-primary' : 'btn-dark')}
          onClick={onCta}
        >
          {ctaLabel}
        </button>
      </nav>
    </header>
  );
}
