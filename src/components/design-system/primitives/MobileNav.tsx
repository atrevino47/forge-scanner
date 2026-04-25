'use client';

import { ForgeLogo } from './ForgeLogo';

interface MobileNavProps {
  dark?: boolean;
}

export function MobileNav({ dark = false }: MobileNavProps) {
  return (
    <header className={'mobile-nav' + (dark ? ' mobile-nav-dark' : '')}>
      <ForgeLogo dark={dark} size={15} />
      <div className="mobile-nav-burger" aria-hidden>
        <span />
        <span />
      </div>
    </header>
  );
}
