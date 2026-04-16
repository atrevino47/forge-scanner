'use client';

import {
  useWorkbook, AnswerArea, StepBadge, Divider,
  WorkbookToolbar, WorkbookHeader, WorkbookShell, cx,
} from './workbook-shared';
import { WorkbookAuth } from './WorkbookAuth';
import { useAuth } from '@/components/providers/SupabaseProvider';

export function BrandingWorkbook() {
  const { user } = useAuth();
  const wb = useWorkbook('en', user?.id);

  return (
    <WorkbookShell loaded={wb.loaded} isDark={wb.isDark}>
      <WorkbookHeader
        title="Brand Workbook"
        subtitle="Build a personal brand that compounds."
        v={wb.v} update={wb.update}
      />

      {/* Auth — register/login */}
      <WorkbookAuth onAuth={wb.handleSave} />

      {/* Intro */}
      <div className="mb-14 rounded-xl border-l-4 border-forge-accent bg-forge-surface/50 px-6 py-5 print:bg-transparent print:border-l-2">
        <span className="inline-block rounded-md bg-forge-accent px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white mb-3">
          Objective
        </span>
        <p className="font-body text-[15px] leading-relaxed text-forge-text-secondary">
          Your brand story isn&apos;t just a before-and-after transformation
          &mdash; it&apos;s a series of intentional decisions that define how
          people see you. Strong brands aren&apos;t built in a single moment
          &mdash; they&apos;re built with consistency, distinction, and the
          right connections to your audience. This workbook will help you
          create a brand that evolves and stays relevant.
        </p>
      </div>

      {/* ══ STEP 01 — YOUR BRAND STORY ══ */}
      <section className="step-section mb-16">
        <StepBadge n={1} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Your Brand Story
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Every strong brand has a story in three parts. Answer each section honestly &mdash; write like you talk, not like you think you should sound.
        </p>

        <h3 className={cx.h3}>01. The Catalyst &mdash; Why Your Brand Exists</h3>
        <p className={cx.body}>Every brand starts because something needed to change. It&apos;s not always a struggle &mdash; sometimes it&apos;s an opportunity nobody else saw.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> Nike didn&apos;t start because Phil Knight wanted to be rich &mdash; it started because he saw a gap in the high-performance shoe market.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>What needs to change in your industry?</li>
          <li>What do you see that others in your space don&apos;t?</li>
          <li>Why do you feel the need to do things differently?</li>
        </ul>
        <AnswerArea id="catalyst" value={wb.v('catalyst')} onChange={(val) => wb.update('catalyst', val)} placeholder="What drove you to start? What gap did you see?" />

        <h3 className={cx.h3}>02. The Core Truth &mdash; What Makes You Different</h3>
        <p className={cx.body}>A strong brand stands out &mdash; it doesn&apos;t blend in. This doesn&apos;t mean being controversial for its own sake &mdash; it means having a conviction that differs from the market and sharing it.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> Russ believes artists should own their music and stay independent. He reinforces this belief through every song and interview.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>What do you believe that others in your field don&apos;t?</li>
          <li>What part of your personality stands out?</li>
          <li>What do people compliment you on that you can leverage?</li>
          <li>Why would your audience care about this?</li>
        </ul>
        <AnswerArea id="coreTruth" value={wb.v('coreTruth')} onChange={(val) => wb.update('coreTruth', val)} placeholder="What's your contrarian belief? What sets you apart?" />

        <h3 className={cx.h3}>03. The Proof &mdash; How You Reinforce Your Identity</h3>
        <p className={cx.body}>A story isn&apos;t what you say &mdash; it&apos;s what you prove over and over. Strong brands don&apos;t just have one past success story &mdash; they have an ongoing pattern of credibility.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> GaryVee didn&apos;t just talk about content volume once &mdash; he&apos;s proven it for over 15 years.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>How does every piece of content reinforce the associations you want people to make with you?</li>
          <li>What case studies or examples can you share to build credibility?</li>
          <li>If someone hears your name, what&apos;s the first thing you want them to think?</li>
        </ul>
        <AnswerArea id="proof" value={wb.v('proof')} onChange={(val) => wb.update('proof', val)} placeholder="What pattern of proof can you point to?" />
      </section>

      <Divider />

      {/* ══ STEP 02 — STORIES WORTH TELLING ══ */}
      <section className="step-section mb-16">
        <StepBadge n={2} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">Stories Worth Telling</h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">Not all stories work equally well in content. The best ones fall into these categories. For each type, write at least one real story from your experience.</p>

        <div className={cx.story}>
          <h3 className={cx.h3}>01. Origin Stories</h3>
          <p className={cx.body}>Why do you do what you do? What moment defined your career?</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;At 22 I watched my family lose everything when my uncle had an accident with no coverage. That day I decided nobody else would go through that.&rdquo;</p>
          <AnswerArea id="originStory" value={wb.v('originStory')} onChange={(val) => wb.update('originStory', val)} rows={4} placeholder="The moment that set your path..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>02. Failure Stories</h3>
          <p className={cx.body}>People trust vulnerability more than success. Talk about what went wrong and what you learned.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;I lost my biggest client because I didn&apos;t understand this one thing...&rdquo;</p>
          <AnswerArea id="failureStory" value={wb.v('failureStory')} onChange={(val) => wb.update('failureStory', val)} rows={4} placeholder="A time things went wrong and what it taught you..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>03. Success Stories</h3>
          <p className={cx.body}>Show before-and-after transformations. Highlight small wins that led to big results.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;A 28-year-old client told me he didn&apos;t need life insurance. Two years later he called me in tears after a difficult diagnosis &mdash; and thanks to the policy, everything was covered.&rdquo;</p>
          <AnswerArea id="successStory" value={wb.v('successStory')} onChange={(val) => wb.update('successStory', val)} rows={4} placeholder="A transformation you made possible..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>04. Client Stories</h3>
          <p className={cx.body}>Let your audience see themselves in your content. Real stories of real people who took action.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;A couple in their mid-30s reached out knowing nothing about financial planning. In 3 months they had full coverage and a savings plan on track for $2M at retirement.&rdquo;</p>
          <AnswerArea id="clientStory" value={wb.v('clientStory')} onChange={(val) => wb.update('clientStory', val)} rows={4} placeholder="A client who took action and got results..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>05. Industry / Thought Leadership Stories</h3>
          <p className={cx.body}>Talk about trends, common mistakes, and changes in your industry that nobody else is mentioning.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;The way companies are handling [X] is changing &mdash; here&apos;s what nobody is telling you...&rdquo;</p>
          <AnswerArea id="industryStory" value={wb.v('industryStory')} onChange={(val) => wb.update('industryStory', val)} rows={4} placeholder="A trend or insight others are missing..." />
        </div>
      </section>

      <Divider />

      {/* ══ STEP 03 — YOUR MARKET ══ */}
      <section className="step-section mb-16">
        <StepBadge n={3} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">Your Ideal Client &amp; Services</h2>

        <h3 className={cx.h3}>Your Client</h3>
        <ul className={cx.questions}>
          <li>Describe your ideal client in one sentence (age, situation, what they need).</li>
          <li>What is your client&apos;s #1 fear about working with someone in your industry?</li>
          <li>What&apos;s the objection you hear most often?</li>
          <li>What do clients value most about working with you?</li>
        </ul>
        <AnswerArea id="idealClient" value={wb.v('idealClient')} onChange={(val) => wb.update('idealClient', val)} placeholder="Who is your dream client? What keeps them up at night?" />

        <h3 className={cx.h3}>Your Services &amp; Products</h3>
        <p className={cx.body}>List your services or products in order from most important to least important for your business. Which one is the easiest to sell, and why?</p>
        <AnswerArea id="services" value={wb.v('services')} onChange={(val) => wb.update('services', val)} placeholder={"1. (most important)\n2.\n3.\n4.\n\nEasiest to sell and why:"} />

        <h3 className={cx.h3}>Resources to Give Away</h3>
        <p className={cx.body}>What guides, calculators, templates, or tools can you offer your audience for free? List at least 3.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;5 questions to ask before hiring a [your industry] professional&rdquo; &middot; &ldquo;ROI calculator for [service]&rdquo; &middot; &ldquo;The beginner&apos;s checklist for [topic]&rdquo;</p>
        <AnswerArea id="freeResources" value={wb.v('freeResources')} onChange={(val) => wb.update('freeResources', val)} rows={4} placeholder={"1.\n2.\n3."} />
      </section>

      <Divider />

      {/* ══ STEP 04 — VOICE & IDENTITY ══ */}
      <section className="step-section mb-16">
        <StepBadge n={4} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">Voice, Visual &amp; Identity</h2>
        <ul className={cx.questions}>
          <li>How do you talk to clients &mdash; formal or casual? First name or Mr./Ms.?</li>
          <li>Do you use slang or colloquialisms? Or do you keep it neutral and polished?</li>
          <li>Do you like your current branding? What would you change?</li>
          <li>Are there social media accounts you admire for how they look? Share 2&ndash;3.</li>
          <li>Complete this sentence: &ldquo;[Your name] is the one who _____.&rdquo;</li>
          <li>What do you want people to <em>feel</em> when they see your content?</li>
        </ul>
        <AnswerArea id="voiceIdentity" value={wb.v('voiceIdentity')} onChange={(val) => wb.update('voiceIdentity', val)} placeholder="Describe how you want your brand to sound, look, and feel..." rows={8} />
      </section>

      <WorkbookToolbar
        completedCount={wb.completedCount} saveStatus={wb.saveStatus}
        onSave={wb.handleSave} onExport={wb.handleExport}
        onReset={() => wb.handleReset('Clear all answers? This cannot be undone.')}
        isDark={wb.isDark} onToggleDark={wb.toggleDark}
      />
    </WorkbookShell>
  );
}
