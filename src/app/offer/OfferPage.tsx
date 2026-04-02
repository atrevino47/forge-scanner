'use client';

import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useCalcom } from '@/components/providers/CalcomContext';

/* ═══════════════════════════════════════════════════════════
 * DATA
 * ═══════════════════════════════════════════════════════════ */

const PROBLEMS = [
  {
    stat: '4 hrs',
    headline: 'A lead fills out your form. Nobody responds for 4 hours.',
    body: 'Speed-to-lead is the single biggest conversion factor. Competitors who answer first win 78% of the time.',
  },
  {
    stat: '0%',
    headline: 'You post content 3x a week. None of it connects to revenue.',
    body: "Content without a capture system behind it is noise. Likes don't pay invoices.",
  },
  {
    stat: '1 of 12',
    headline: 'Your follow-up is one email and a prayer.',
    body: 'Leads need 7\u201312 touches before they buy. Most businesses send one and move on.',
  },
  {
    stat: '2%',
    headline: 'Your landing page converts at 2%. It should be 8%.',
    body: "Every percentage point is real money. On $50K/mo in traffic, that's $150K/yr left on the table.",
  },
  {
    stat: '$0',
    headline: 'You spend $5K/mo on ads testing creative that organic could prove for free.',
    body: 'Organic is the testing ground. Ads amplify proven winners. Most businesses do it backwards.',
  },
  {
    stat: '???',
    headline: "You can't tell which dollar produced which sale.",
    body: "No attribution means no scaling decisions. You're flying blind and calling it strategy.",
  },
];

const FAQ_ITEMS = [
  {
    q: "What if $12,500/mo isn't in the budget right now?",
    a: "The Minimum tier ($2,500/mo) isn't a gutted version of Core \u2014 it's a different product for a different buyer. Forge builds your content engine and basic automation. You record, you close. It's real work at a lower commitment. And the upgrade path is built into the math, not a sales pitch.",
  },
  {
    q: 'What happens after 90 days?',
    a: "You own everything we built \u2014 landing pages, funnels, sequences, CRM, ad accounts. All in your name, on your domain. The retainer covers ongoing optimization: ad management, creative refresh, strategy calls, A/B testing. You're paying for a head chef who keeps the kitchen at its ceiling. Not for the kitchen.",
  },
  {
    q: "What's the performance bonus?",
    a: "A percentage of new revenue we help generate. 8% at Minimum, 5% at Core, 3% at Full Stack. Lower commission at higher tiers means you keep more as you scale. At $25M in growth, Full Stack clients keep nearly $1M/yr more than Minimum. The spreadsheet creates the upgrade conversation \u2014 not us.",
  },
  {
    q: 'Do I need to create content?',
    a: "You need to show up on camera. We write every script, every hook, every CTA. You record from our shot list \u2014 typically 30\u201360 minutes per week. That's the one honest effort requirement. And every video you record is an asset you own.",
  },
  {
    q: "What if it doesn't work?",
    a: "Core has a Day 21 fast-win target: first inbound lead from new infrastructure, or we deliver a written remediation plan. Full Stack has a performance guarantee: 30% qualified lead lift within 90 days or one month credited \u2014 $25,000. We put measurable stakes on results.",
  },
  {
    q: 'How is this different from a marketing agency?',
    a: "Agencies rent you their systems. When you leave, you start over with nothing. We build infrastructure you own \u2014 in your accounts, on your domain, with your data. If you fire us tomorrow, everything still works. The retainer pays for intelligence, not dependency.",
  },
];

/* ═══════════════════════════════════════════════════════════
 * HERO
 * ═══════════════════════════════════════════════════════════ */

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { openCalcom } = useCalcom();

  /* ANIMATION SEQUENCE — HERO:
   * Beat 1 (0.00s): Badge — fadeSlideUp
   * Beat 2 (0.15s): Headline — clipReveal
   * Beat 3 (0.40s): Subheadline — fadeSlideUp
   * Beat 4 (0.55s): CTAs — fadeSlideUp
   * Beat 5 (0.70s): Contrarian — fadeSlideUp
   */
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('[data-hero="badge"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo(
          '[data-hero="h1"]',
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.8 },
          0.15,
        )
        .fromTo('[data-hero="sub"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.4)
        .fromTo('[data-hero="ctas"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.55)
        .fromTo('[data-hero="line"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, 0.7);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="flex min-h-[85vh] flex-col items-center justify-center px-5 pt-14 text-center">
      <div style={{ maxWidth: 960 }}>
        <p
          data-hero="badge"
          className="mb-6 font-mono text-xs uppercase tracking-widest opacity-0"
          style={{ color: 'var(--forge-text-muted)' }}
        >
          AI-Powered Sales Infrastructure
        </p>

        <h1
          data-hero="h1"
          className="font-display font-extrabold"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          Your sales infrastructure is broken.
          <br />
          <span style={{ color: 'var(--forge-text-secondary)' }}>We build one that works.</span>
        </h1>

        <p
          data-hero="sub"
          className="mx-auto mt-6 max-w-2xl text-lg opacity-0"
          style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}
        >
          For service businesses doing $500K&ndash;$5M. We build your AI-powered sales machine in 90 days. You own
          everything. Month 4, you pay for optimization&nbsp;&mdash; not dependency.
        </p>

        <div data-hero="ctas" className="mt-10 flex flex-wrap items-center justify-center gap-4 opacity-0">
          <Link
            href="/"
            className="rounded-lg px-7 py-3.5 font-display text-sm font-semibold tracking-wide text-white transition-shadow duration-200 hover:shadow-lg"
            style={{ background: 'var(--forge-accent)' }}
          >
            Get Your Free Scan
          </Link>
          <button
            onClick={() => openCalcom({ source: 'offer_hero' })}
            className="rounded-lg px-7 py-3.5 font-display text-sm font-semibold tracking-wide transition-colors duration-200"
            style={{ color: 'var(--forge-text)', background: 'var(--forge-surface)' }}
          >
            Book a Strategy Call
          </button>
        </div>

        <p
          data-hero="line"
          className="mx-auto mt-16 max-w-md font-display text-sm font-medium italic opacity-0"
          style={{ color: 'var(--forge-text-muted)' }}
        >
          &ldquo;AI isn&rsquo;t magic. It&rsquo;s infrastructure. And infrastructure takes engineering, not
          prompts.&rdquo;
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * PROBLEMS
 * ═══════════════════════════════════════════════════════════ */

function ProblemsSection() {
  const ref = useRef<HTMLElement>(null);

  /* ANIMATION SEQUENCE — PROBLEMS:
   * Beat 1 (0.00s): Section title — clipReveal
   * Beat 2 (0.20s): Problem cards — fadeSlideUp, 120ms stagger
   */
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        defaults: { ease: 'power3.out' },
      })
        .fromTo('[data-prob="title"]', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 })
        .fromTo(
          '[data-prob="card"]',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 },
          0.2,
        );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="px-5 py-24 sm:py-32">
      <div className="mx-auto" style={{ maxWidth: 1120 }}>
        <h2
          data-prob="title"
          className="mb-16 text-center font-display font-extrabold"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          Sound familiar?
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div
              key={p.stat}
              data-prob="card"
              className="rounded-xl p-6 opacity-0"
              style={{ background: 'var(--forge-surface)' }}
            >
              <span
                className="mb-3 inline-block font-mono text-2xl font-medium"
                style={{ color: 'var(--forge-accent)' }}
              >
                {p.stat}
              </span>
              <h3
                className="mb-2 font-display text-base font-bold"
                style={{ color: 'var(--forge-text)', lineHeight: 1.3 }}
              >
                {p.headline}
              </h3>
              <p className="text-sm" style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * HOW IT WORKS
 * ═══════════════════════════════════════════════════════════ */

function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);

  /* ANIMATION SEQUENCE — HOW IT WORKS:
   * Beat 1 (0.00s): Title — clipReveal
   * Beat 2 (0.20s): Steps — fadeSlideUp, 150ms stagger
   */
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        defaults: { ease: 'power3.out' },
      })
        .fromTo('[data-how="title"]', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 })
        .fromTo(
          '[data-how="step"]',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 },
          0.2,
        );
    },
    { scope: ref },
  );

  const steps = [
    {
      num: '01',
      title: 'Diagnose',
      body: 'The Forge Scanner shows exactly what\u2019s broken and where money is leaking. Free, instant, no strings.',
    },
    {
      num: '02',
      title: 'Build',
      body: 'We build your AI-powered sales infrastructure in 90 days. Landing pages, funnels, follow-up, content engine, ads \u2014 the full system.',
    },
    {
      num: '03',
      title: 'Own',
      body: 'Month 4+: you own the infrastructure. The retainer pays for a head chef optimizing the menu \u2014 not for the kitchen.',
    },
  ];

  return (
    <section ref={ref} className="px-5 py-24 sm:py-32" style={{ background: 'var(--forge-surface)' }}>
      <div className="mx-auto" style={{ maxWidth: 960 }}>
        <h2
          data-how="title"
          className="mb-16 text-center font-display font-extrabold"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          How it works
        </h2>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((s) => (
            <div key={s.num} data-how="step" className="opacity-0">
              <span className="mb-3 block font-mono text-xs tracking-widest" style={{ color: 'var(--forge-text-muted)' }}>
                {s.num}
              </span>
              <h3
                className="mb-2 font-display text-xl font-bold"
                style={{ color: 'var(--forge-text)', letterSpacing: '-0.01em' }}
              >
                {s.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * TIERS
 * ═══════════════════════════════════════════════════════════ */

function TiersSection() {
  const ref = useRef<HTMLElement>(null);
  const { openCalcom } = useCalcom();

  /* ANIMATION SEQUENCE — TIERS:
   * Beat 1 (0.00s): Section title — clipReveal
   * Beat 2 (0.15s): Subtitle — fadeSlideUp
   * Beat 3 (0.30s): Tier cards — scaleIn, 150ms stagger
   */
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        defaults: { ease: 'power2.out' },
      })
        .fromTo('[data-tier="title"]', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power3.out' })
        .fromTo('[data-tier="sub"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.15)
        .fromTo(
          '[data-tier="card"]',
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.6, stagger: 0.15 },
          0.3,
        );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="px-5 py-24 sm:py-32">
      <div className="mx-auto" style={{ maxWidth: 1120 }}>
        <h2
          data-tier="title"
          className="mb-4 text-center font-display font-extrabold"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          Three ways to work with Forge
        </h2>
        <p
          data-tier="sub"
          className="mx-auto mb-16 max-w-xl text-center opacity-0"
          style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}
        >
          Not small/medium/large. Three different economic relationships &mdash; each with its own math.
        </p>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          {/* ── MINIMUM ── */}
          <div
            data-tier="card"
            className="flex flex-col rounded-xl p-7 opacity-0"
            style={{ background: 'var(--forge-surface)' }}
          >
            <span
              className="mb-4 inline-block self-start rounded-md px-3 py-1 font-mono text-xs uppercase tracking-widest"
              style={{ background: 'var(--forge-card)', color: 'var(--forge-text-secondary)' }}
            >
              The Engine
            </span>
            <div className="mb-1 font-display text-xl font-bold" style={{ color: 'var(--forge-text)' }}>
              Minimum
            </div>
            <div className="mb-5 flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-medium" style={{ color: 'var(--forge-text)' }}>
                $2,500
              </span>
              <span className="font-mono text-sm" style={{ color: 'var(--forge-text-muted)' }}>
                /mo
              </span>
              <span className="ml-2 font-mono text-sm" style={{ color: 'var(--forge-text-secondary)' }}>
                + 8% commission
              </span>
            </div>
            <p className="mb-6 text-sm" style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}>
              Forge builds your content engine and basic automation. Low entry, real work, full alignment &mdash; you
              only pay big when you win big.
            </p>
            <ul className="mb-8 flex flex-col gap-3">
              {[
                'Leads get a response in seconds, not hours',
                'Your content engine runs without you thinking about it',
                'You see exactly where money is bleeding and how to stop it',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--forge-text)' }}>
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--forge-positive)' }} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <p className="mb-3 font-mono text-xs" style={{ color: 'var(--forge-text-muted)' }}>
                No setup fee
              </p>
              <Link
                href="/"
                className="block rounded-lg py-3 text-center font-display text-sm font-semibold transition-colors duration-200"
                style={{ background: 'var(--forge-card)', color: 'var(--forge-text)' }}
              >
                Start with a Free Scan
              </Link>
            </div>
          </div>

          {/* ── CORE ── */}
          <div
            data-tier="card"
            className="relative flex flex-col rounded-xl p-7 opacity-0 lg:-mt-3 lg:pb-10"
            style={{ background: 'var(--forge-card)' }}
          >
            <span
              className="mb-4 inline-block self-start rounded-md px-3 py-1 font-mono text-xs uppercase tracking-widest text-white"
              style={{ background: 'var(--forge-accent)' }}
            >
              Recommended
            </span>
            <div className="mb-1 font-display text-xl font-bold" style={{ color: 'var(--forge-text)' }}>
              Core
            </div>
            <div className="mb-5 flex flex-wrap items-baseline gap-1.5">
              <span className="font-mono text-3xl font-medium" style={{ color: 'var(--forge-text)' }}>
                $12,500
              </span>
              <span className="font-mono text-sm" style={{ color: 'var(--forge-text-muted)' }}>
                /mo
              </span>
              <span className="ml-2 font-mono text-sm" style={{ color: 'var(--forge-text-secondary)' }}>
                + 5% commission
              </span>
            </div>
            <p className="mb-6 text-sm" style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}>
              Full done-for-you sales infrastructure. Forge builds it, Forge runs it. Your only jobs: record content and
              close deals. You own everything we build.
            </p>
            <ul className="mb-8 flex flex-col gap-3">
              {[
                'Instant lead response captures what competitors miss',
                'Every piece of content connects to a capture system',
                'Follow-up sequences nurture for weeks, not one email',
                'Your landing page rebuilt to convert at 8%, not 2%',
                'Ad spend only goes to organic-proven winners',
                'Full pipeline visibility \u2014 know exactly what\u2019s working',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--forge-text)' }}>
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--forge-positive)' }} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <p className="mb-3 font-mono text-xs" style={{ color: 'var(--forge-text-muted)' }}>
                $5,000 setup &middot; Waived for 12-month commitment
              </p>
              <button
                onClick={() => openCalcom({ source: 'offer_core' })}
                className="w-full rounded-lg py-3 text-center font-display text-sm font-semibold text-white transition-shadow duration-200 hover:shadow-lg"
                style={{ background: 'var(--forge-accent)' }}
              >
                Book a Strategy Call
              </button>
            </div>
          </div>

          {/* ── FULL STACK ── */}
          <div
            data-tier="card"
            className="flex flex-col rounded-xl p-7 opacity-0"
            style={{ background: '#141413', color: '#F0EFE9' }}
          >
            <span
              className="mb-4 inline-block self-start rounded-md px-3 py-1 font-mono text-xs uppercase tracking-widest"
              style={{ background: 'rgba(255, 107, 43, 0.12)', color: '#FF6B2B' }}
            >
              Qualified Only
            </span>
            <div className="mb-1 font-display text-xl font-bold">Full Stack</div>
            <div className="mb-5 flex flex-wrap items-baseline gap-1.5">
              <span className="font-mono text-3xl font-medium">$25,000</span>
              <span className="font-mono text-sm" style={{ color: '#9A9890' }}>
                /mo
              </span>
              <span className="ml-2 font-mono text-sm" style={{ color: '#9A9890' }}>
                + 3% commission
              </span>
            </div>
            <p className="mb-6 text-sm" style={{ color: '#9A9890', lineHeight: 1.65 }}>
              The AI intelligence layer. Everything in Core plus speed-to-lead AI, growth command center, pipeline
              forecasting, competitive monitoring, and Adrian as your fractional head of growth.
            </p>
            <ul className="mb-8 flex flex-col gap-3">
              {[
                '60-second response across all channels, 24/7',
                'AI finds upsell moments in your existing customer base',
                'Your team closes at 30%+ without you on every call',
                'Unified command center \u2014 every dollar traced to every sale',
                'Weekly competitive monitoring catches what you\u2019d miss',
                '30% qualified lead lift guarantee or one month credited',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: '#F0EFE9' }}>
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#FF6B2B' }} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <p className="mb-3 font-mono text-xs" style={{ color: '#9A9890' }}>
                $10,000 setup &middot; For $5M+ businesses
              </p>
              <button
                onClick={() => openCalcom({ source: 'offer_fullstack' })}
                className="w-full rounded-lg py-3 text-center font-display text-sm font-semibold transition-shadow duration-200 hover:shadow-lg"
                style={{ background: 'rgba(255, 107, 43, 0.15)', color: '#FF6B2B' }}
              >
                Book a Strategy Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * ROI — INVESTMENT vs RETURN + COMMISSION CROSSOVER
 * ═══════════════════════════════════════════════════════════ */

function ROISection() {
  const ref = useRef<HTMLElement>(null);

  /* ANIMATION SEQUENCE — ROI:
   * Beat 1 (0.00s): Section title — clipReveal
   * Beat 2 (0.20s): ROI cards — fadeSlideUp, 150ms stagger
   * Beat 3 (0.60s): Crossover title — clipReveal
   * Beat 4 (0.75s): Crossover rows — fadeSlideUp, 120ms stagger
   * Beat 5 (1.10s): Callout — popIn
   */
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        defaults: { ease: 'power3.out' },
      })
        .fromTo('[data-roi="title"]', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 })
        .fromTo(
          '[data-roi="card"]',
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 },
          0.2,
        )
        .fromTo(
          '[data-roi="cross-title"]',
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.8 },
          0.6,
        )
        .fromTo(
          '[data-roi="bar"]',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 },
          0.75,
        )
        .fromTo(
          '[data-roi="callout"]',
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' },
          1.1,
        );
    },
    { scope: ref },
  );

  const roiCards = [
    {
      tier: 'Minimum',
      audience: '$1M/yr business',
      invest: '$30,000',
      investPct: 46,
      recover: '$65,000',
      recoverPct: 100,
      roi: '2.2x',
      note: 'One landing page fix recovers 30\u201350% of lost leads.',
    },
    {
      tier: 'Core',
      audience: '$1M/yr business',
      invest: '$155,000',
      investPct: 62,
      recover: '$250,000',
      recoverPct: 100,
      roi: '1.6x',
      note: '25% lead capture improvement. Compounds to 3x+ in Year 2.',
    },
    {
      tier: 'Full Stack',
      audience: '$5M/yr business',
      invest: '$310,000',
      investPct: 21,
      recover: '$1,500,000',
      recoverPct: 100,
      roi: '4.8x',
      note: '30% qualified lead lift. Conservative estimate.',
    },
  ];

  /* Commission crossover at $25M in growth (annual numbers) */
  const crossover = [
    { tier: 'Minimum', rate: '8%', total: '$2.03M', pct: 100 },
    { tier: 'Core', rate: '5%', total: '$1.40M', pct: 69 },
    { tier: 'Full Stack', rate: '3%', total: '$1.05M', pct: 52 },
  ];

  return (
    <section ref={ref} className="px-5 py-24 sm:py-32" style={{ background: 'var(--forge-surface)' }}>
      <div className="mx-auto" style={{ maxWidth: 1120 }}>
        {/* ── ROI per tier ── */}
        <h2
          data-roi="title"
          className="mb-16 text-center font-display font-extrabold"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          The math. Not the pitch.
        </h2>

        <div className="mb-20 grid gap-6 lg:grid-cols-3">
          {roiCards.map((c) => (
            <div
              key={c.tier}
              data-roi="card"
              className="rounded-xl p-6 opacity-0"
              style={{ background: 'var(--forge-base)' }}
            >
              <div className="mb-1 font-display text-base font-bold" style={{ color: 'var(--forge-text)' }}>
                {c.tier}
              </div>
              <p className="mb-5 font-mono text-xs" style={{ color: 'var(--forge-text-muted)' }}>
                For a {c.audience}
              </p>

              {/* Invest bar */}
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--forge-text-secondary)' }}>
                  You invest
                </span>
                <span className="font-mono text-sm font-medium" style={{ color: 'var(--forge-text)' }}>
                  {c.invest}
                  <span className="font-normal" style={{ color: 'var(--forge-text-muted)' }}>
                    {' '}/yr
                  </span>
                </span>
              </div>
              <div className="mb-4 h-3 overflow-hidden rounded-full" style={{ background: 'var(--forge-card)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.investPct}%`, background: 'var(--forge-text-muted)' }}
                />
              </div>

              {/* Recover bar */}
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--forge-text-secondary)' }}>
                  Conservative return
                </span>
                <span className="font-mono text-sm font-medium" style={{ color: 'var(--forge-positive)' }}>
                  {c.recover}
                  <span style={{ color: 'var(--forge-text-muted)' }}> /yr</span>
                </span>
              </div>
              <div className="mb-5 h-3 overflow-hidden rounded-full" style={{ background: 'var(--forge-card)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.recoverPct}%`, background: 'var(--forge-positive)' }}
                />
              </div>

              {/* ROI number */}
              <div className="flex items-baseline justify-between">
                <span
                  className="font-mono font-medium"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--forge-text)', lineHeight: 1 }}
                >
                  {c.roi}
                </span>
                <span className="max-w-[60%] text-right text-xs" style={{ color: 'var(--forge-text-muted)', lineHeight: 1.4 }}>
                  {c.note}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Commission crossover ── */}
        <h3
          data-roi="cross-title"
          className="mb-3 text-center font-display text-xl font-bold"
          style={{
            color: 'var(--forge-text)',
            letterSpacing: '-0.01em',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          Higher tier = lower commission = you keep more
        </h3>
        <p className="mx-auto mb-10 max-w-lg text-center text-sm" style={{ color: 'var(--forge-text-secondary)' }}>
          Total annual cost to Forge at <span className="font-mono font-medium">$25M</span> in new revenue growth.
        </p>

        <div className="mx-auto flex flex-col gap-4" style={{ maxWidth: 640 }}>
          {crossover.map((row) => (
            <div key={row.tier} data-roi="bar" className="opacity-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--forge-text)' }}>
                  {row.tier}{' '}
                  <span className="font-mono text-xs font-normal" style={{ color: 'var(--forge-text-muted)' }}>
                    ({row.rate})
                  </span>
                </span>
                <span className="font-mono text-sm font-medium" style={{ color: 'var(--forge-text)' }}>
                  {row.total}
                  <span className="font-normal" style={{ color: 'var(--forge-text-muted)' }}>
                    {' '}/yr
                  </span>
                </span>
              </div>
              <div className="h-5 overflow-hidden rounded-md" style={{ background: 'var(--forge-card)' }}>
                <div
                  className="h-full rounded-md transition-all duration-500"
                  style={{
                    width: `${row.pct}%`,
                    background: row.tier === 'Full Stack' ? 'var(--forge-positive)' : 'var(--forge-text-muted)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          data-roi="callout"
          className="mx-auto mt-8 max-w-lg rounded-xl p-5 text-center opacity-0"
          style={{ background: 'var(--forge-base)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--forge-text)' }}>
            Full Stack saves{' '}
            <span className="font-mono" style={{ color: 'var(--forge-positive)' }}>
              $980K/yr
            </span>{' '}
            over Minimum at $25M scale.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--forge-text-muted)' }}>
            The math creates the upgrade conversation. Not us.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * OWNERSHIP
 * ═══════════════════════════════════════════════════════════ */

function OwnershipSection() {
  const ref = useRef<HTMLElement>(null);

  /* ANIMATION SEQUENCE — OWNERSHIP:
   * Beat 1 (0.00s): Headline — clipReveal
   * Beat 2 (0.20s): Body — fadeSlideUp
   * Beat 3 (0.40s): Items — fadeSlideUp, 120ms stagger
   */
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        defaults: { ease: 'power3.out' },
      })
        .fromTo('[data-own="h2"]', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 })
        .fromTo('[data-own="body"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.2)
        .fromTo(
          '[data-own="item"]',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 },
          0.4,
        );
    },
    { scope: ref },
  );

  const items = [
    { title: 'Your domain', desc: 'Landing pages, funnels, lead capture \u2014 all live on your domain.' },
    { title: 'Your accounts', desc: 'CRM, ad accounts, email tools, tracking \u2014 all under your credentials.' },
    { title: 'Your data', desc: 'Every lead, every metric, every insight \u2014 lives in systems you control.' },
    { title: 'Your content', desc: 'Scripts, hooks, ad creatives, sequences \u2014 we wrote them, you own them.' },
  ];

  return (
    <section ref={ref} className="px-5 py-24 sm:py-32">
      <div className="mx-auto" style={{ maxWidth: 960 }}>
        <h2
          data-own="h2"
          className="mb-6 font-display font-extrabold"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          You own everything we build.
        </h2>
        <p
          data-own="body"
          className="mb-12 max-w-2xl text-lg opacity-0"
          style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}
        >
          We build the kitchen. You own the kitchen. The retainer keeps a head chef optimizing the menu &mdash; not
          because it doesn&rsquo;t work without us, but because a great chef makes the kitchen perform at its ceiling.
          If you fire us tomorrow, everything still runs.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} data-own="item" className="rounded-lg p-5 opacity-0" style={{ background: 'var(--forge-surface)' }}>
              <h3 className="mb-1 font-display text-base font-bold" style={{ color: 'var(--forge-text)' }}>
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * FAQ
 * ═══════════════════════════════════════════════════════════ */

function FAQSection() {
  const ref = useRef<HTMLElement>(null);

  /* ANIMATION SEQUENCE — FAQ:
   * Beat 1 (0.00s): Section title — clipReveal
   * Beat 2 (0.20s): FAQ items — fadeSlideUp, 100ms stagger
   */
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
        defaults: { ease: 'power3.out' },
      })
        .fromTo('[data-faq="title"]', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8 })
        .fromTo(
          '[data-faq="item"]',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
          0.2,
        );
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="px-5 py-24 sm:py-32" style={{ background: 'var(--forge-surface)' }}>
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        <h2
          data-faq="title"
          className="mb-14 text-center font-display font-extrabold"
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          Common questions
        </h2>

        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((faq) => (
            <details
              key={faq.q}
              data-faq="item"
              className="group rounded-lg opacity-0"
              style={{ background: 'var(--forge-base)' }}
            >
              <summary
                className="flex cursor-pointer items-center justify-between px-6 py-5 font-display text-sm font-semibold select-none"
                style={{ color: 'var(--forge-text)' }}
              >
                {faq.q}
                <span
                  className="ml-4 shrink-0 text-lg transition-transform duration-200 group-open:rotate-45"
                  style={{ color: 'var(--forge-text-muted)' }}
                >
                  +
                </span>
              </summary>
              <div className="px-6 pb-5">
                <p className="text-sm" style={{ color: 'var(--forge-text-secondary)', lineHeight: 1.65 }}>
                  {faq.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * FINAL CTA
 * ═══════════════════════════════════════════════════════════ */

function FinalCTASection() {
  const ref = useRef<HTMLElement>(null);
  const { openCalcom } = useCalcom();

  /* ANIMATION SEQUENCE — FINAL CTA:
   * Beat 1 (0.00s): Container — scaleIn
   * Beat 2 (0.20s): Headline — clipReveal
   * Beat 3 (0.45s): Sub + CTAs — fadeSlideUp
   */
  useGSAP(
    () => {
      gsap.timeline({
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
        defaults: { ease: 'power3.out' },
      })
        .fromTo('[data-cta="box"]', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6 })
        .fromTo(
          '[data-cta="h2"]',
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.8 },
          0.2,
        )
        .fromTo('[data-cta="content"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, 0.45);
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="px-5 py-24 sm:py-32">
      <div
        data-cta="box"
        className="mx-auto rounded-2xl px-7 py-16 text-center opacity-0 sm:px-12 sm:py-20 inner-grid-pattern"
        style={{ maxWidth: 960, background: '#141413' }}
      >
        <h2
          data-cta="h2"
          className="font-display font-extrabold"
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: '#F0EFE9',
            clipPath: 'inset(0 0 100% 0)',
          }}
        >
          See what&rsquo;s broken.
        </h2>

        <div data-cta="content" className="opacity-0">
          <p className="mx-auto mt-5 max-w-md text-base" style={{ color: '#9A9890', lineHeight: 1.65 }}>
            The Forge Scanner shows you exactly where money is leaking &mdash; free, in under 60 seconds. Or skip
            straight to a strategy call.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="rounded-lg px-7 py-3.5 font-display text-sm font-semibold tracking-wide text-white transition-shadow duration-200 hover:shadow-lg"
              style={{ background: 'var(--forge-accent)' }}
            >
              Get Your Free Scan
            </Link>
            <button
              onClick={() => openCalcom({ source: 'offer_bottom_cta' })}
              className="rounded-lg px-7 py-3.5 font-display text-sm font-semibold tracking-wide transition-colors duration-200"
              style={{ color: '#F0EFE9', background: 'rgba(255, 255, 255, 0.08)' }}
            >
              Book a Strategy Call
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
 * PAGE EXPORT
 * ═══════════════════════════════════════════════════════════ */

export function OfferPage() {
  return (
    <div>
      <HeroSection />
      <ProblemsSection />
      <HowItWorksSection />
      <TiersSection />
      <ROISection />
      <OwnershipSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
}
