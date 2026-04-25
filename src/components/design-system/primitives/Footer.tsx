import { ForgeLogo } from './ForgeLogo';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: 'Scanner',
    links: [
      { label: 'Run a scan', href: '/' },
      { label: 'How it works', href: '/#how-it-works' },
    ],
  },
  {
    title: 'Offer',
    links: [
      { label: 'Pricing', href: '/offer' },
      { label: 'Book a call', href: '/offer#book' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', href: '/#faq' },
      { label: 'Sample report', href: '/#sample' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="forge-footer">
      <div className="forge-footer-inner">
        <div className="forge-footer-brand">
          <ForgeLogo />
          <p className="body forge-footer-blurb">
            AI isn&apos;t magic. It&apos;s infrastructure. And infrastructure takes
            engineering, not prompts.
          </p>
        </div>
        <div className="forge-footer-columns">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="eyebrow forge-footer-col-title">{col.title}</div>
              <div className="forge-footer-col-links">
                {col.links.map((link) => (
                  <a key={link.label} href={link.href} className="body forge-footer-link">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hair forge-footer-hair" />
      <div className="forge-footer-base">
        <span className="mono forge-footer-meta">© 2026 FORGEWITH.AI</span>
        <span className="mono forge-footer-meta">All rights reserved</span>
      </div>
    </footer>
  );
}
