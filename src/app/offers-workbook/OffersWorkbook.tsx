'use client';

import {
  useWorkbook, AnswerArea, StepBadge, Divider,
  WorkbookToolbar, WorkbookHeader, WorkbookShell, cx,
  OFFERS_CONTENT_FIELDS,
} from '../branding-workbook/workbook-shared';
import { WorkbookAuth } from '../branding-workbook/WorkbookAuth';
import { useAuth } from '@/components/providers/SupabaseProvider';

export function OffersWorkbook() {
  const { user } = useAuth();
  const wb = useWorkbook('en', user?.id, { type: 'offers', contentFields: OFFERS_CONTENT_FIELDS });

  return (
    <WorkbookShell loaded={wb.loaded} isDark={wb.isDark}>
      <WorkbookHeader
        title="Offer Workbook"
        subtitle="Build an offer so good, saying no feels stupid."
        v={wb.v} update={wb.update}
      />

      <WorkbookAuth onAuth={wb.handleSave} />

      {/* Intro */}
      <div className="mb-14 rounded-xl border-l-4 border-forge-accent bg-forge-surface/50 px-6 py-5 print:bg-transparent print:border-l-2">
        <span className="inline-block rounded-md bg-forge-accent px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white mb-3">
          Objective
        </span>
        <p className="font-body text-[15px] leading-relaxed text-forge-text-secondary">
          Most businesses compete on price because their offers look identical. A Grand Slam Offer is different &mdash;
          so different the prospect can&apos;t compare it to anything else. The decision stops being
          &ldquo;you vs. a cheaper option&rdquo; and becomes &ldquo;you vs. doing nothing.&rdquo; This workbook walks you through
          the seven moves that get you there: pick the right crowd, nail the dream outcome, inventory every problem,
          reverse them into solutions, choose how to deliver, trim and stack the bundle, then enhance.
        </p>
      </div>

      {/* ══ STEP 01 — STARVING CROWD ══ */}
      <section className="step-section mb-16">
        <StepBadge n={1} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Your Starving Crowd
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Pick the market before you pick the offer. A mediocre offer to a starving crowd beats a great offer to an indifferent one.
        </p>

        <h3 className={cx.h3}>01. The Avatar &mdash; Who Specifically</h3>
        <p className={cx.body}>Describe a single, specific person &mdash; not a segment. The more specific, the more it feels like you were built for them.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;HVAC business owners, $2&ndash;5M/yr, running 3&ndash;8 trucks, who still dispatch from a spreadsheet, stressed about Q3 slowdown, 45&ndash;55 years old, usually the founder.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>Who is the one person you&apos;d bet your last dollar has this pain?</li>
          <li>What industry? What revenue range? What life stage?</li>
          <li>What does their Tuesday morning look like?</li>
          <li>How do they find out about solutions &mdash; podcasts, conferences, LinkedIn, friends?</li>
        </ul>
        <AnswerArea id="crowdAvatar" value={wb.v('crowdAvatar')} onChange={(val) => wb.update('crowdAvatar', val)} placeholder="Describe one specific person, not a category..." />

        <h3 className={cx.h3}>02. The Pain &mdash; What They&apos;d Pay to Fix Tomorrow</h3>
        <p className={cx.body}>Starving crowds have a pain that&apos;s urgent, visible, and expensive to leave unsolved. If the pain is mild, the offer won&apos;t matter.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;They&apos;re losing $30K/mo because half their inbound leads never get called back. They know it. They can&apos;t fix it without hiring. Hiring is a nightmare.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>What&apos;s their #1 pain &mdash; the one that keeps them up at night?</li>
          <li>How much does this pain cost them monthly in money, time, or stress?</li>
          <li>Have they tried to solve it before? What didn&apos;t work?</li>
          <li>Why is now different &mdash; what forces them to act this quarter instead of next year?</li>
        </ul>
        <AnswerArea id="crowdPain" value={wb.v('crowdPain')} onChange={(val) => wb.update('crowdPain', val)} placeholder="The single pain they'd pay to make go away tomorrow..." />
      </section>

      <Divider />

      {/* ══ STEP 02 — DREAM OUTCOME ══ */}
      <section className="step-section mb-16">
        <StepBadge n={2} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          The Dream Outcome
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Nobody buys a gym membership &mdash; they buy losing 20 pounds. Sell the vacation, not the plane flight. Define the destination.
        </p>

        <h3 className={cx.h3}>01. The Destination</h3>
        <p className={cx.body}>What does their life look like <em>after</em> the problem is solved? Paint the picture in concrete detail.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;They walk in Monday, their team is already dispatched, every lead from the weekend was called back within 2 hours, and they&apos;re reviewing a revenue dashboard that shows Q3 ahead of Q2 for the first time ever.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>What does their calendar look like in 90 days if your offer works?</li>
          <li>What stops happening &mdash; what anxiety, task, or stressor disappears?</li>
          <li>What becomes possible that wasn&apos;t before?</li>
          <li>What do they tell their spouse at dinner?</li>
        </ul>
        <AnswerArea id="dreamOutcome" value={wb.v('dreamOutcome')} onChange={(val) => wb.update('dreamOutcome', val)} placeholder="Paint the picture of their life after the problem is gone..." />

        <h3 className={cx.h3}>02. The Status Gain</h3>
        <p className={cx.body}>Humans are status-seekers. The outcomes that sell hardest are the ones that raise someone&apos;s standing &mdash; in their peer group, their industry, their family, their own mirror.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;At the trade association meeting, the other owners ask him how he pulled it off. He becomes the guy people want to be next to.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>Who needs to see them win for it to feel real &mdash; peers, employees, family?</li>
          <li>What would they be proud to post or tell someone about?</li>
          <li>What fear of looking stupid disappears when they have your solution?</li>
        </ul>
        <AnswerArea id="statusGain" value={wb.v('statusGain')} onChange={(val) => wb.update('statusGain', val)} placeholder="How does the outcome change how others see them?" />
      </section>

      <Divider />

      {/* ══ STEP 03 — PROBLEM INVENTORY ══ */}
      <section className="step-section mb-16">
        <StepBadge n={3} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Problem Inventory
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Every obstacle between where they are now and the dream outcome is a place your offer can add value. Go long &mdash; twenty problems is better than five. We&apos;ll filter them through the four lenses of the Value Equation.
        </p>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lens 1: &ldquo;Will this be worth it?&rdquo; (Dream Outcome doubts)</h3>
          <p className={cx.body}>Problems that make them question whether the payoff justifies the price &mdash; financial, emotional, or reputational.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;I&apos;m not sure the ROI is actually there.&rdquo; &middot; &ldquo;Last time I paid for something like this, it didn&apos;t work.&rdquo; &middot; &ldquo;What if I pay and it doesn&apos;t move the needle?&rdquo;</p>
          <AnswerArea id="problemsDream" value={wb.v('problemsDream')} onChange={(val) => wb.update('problemsDream', val)} rows={5} placeholder="List every reason they&apos;d doubt the payoff is real..." />
        </div>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lens 2: &ldquo;Will it work for ME?&rdquo; (Likelihood doubts)</h3>
          <p className={cx.body}>Problems that make them believe other people get results, but they won&apos;t. Track record, fit, uniqueness of their situation.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;My business is different.&rdquo; &middot; &ldquo;I&apos;ve tried agencies before and they all overpromised.&rdquo; &middot; &ldquo;My team won&apos;t actually follow through.&rdquo;</p>
          <AnswerArea id="problemsLikelihood" value={wb.v('problemsLikelihood')} onChange={(val) => wb.update('problemsLikelihood', val)} rows={5} placeholder="List every reason they&apos;d believe it works for others but not them..." />
        </div>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lens 3: &ldquo;Is this too hard?&rdquo; (Effort &amp; Sacrifice doubts)</h3>
          <p className={cx.body}>Problems around complexity, workload, what they&apos;d have to give up, skills they don&apos;t have.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;I don&apos;t have time to learn this.&rdquo; &middot; &ldquo;I hate technology.&rdquo; &middot; &ldquo;My team is already at capacity.&rdquo; &middot; &ldquo;I&apos;d have to rebuild a bunch of stuff first.&rdquo;</p>
          <AnswerArea id="problemsEffort" value={wb.v('problemsEffort')} onChange={(val) => wb.update('problemsEffort', val)} rows={5} placeholder="List everything that feels like too much work or too hard..." />
        </div>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lens 4: &ldquo;Will this take too long?&rdquo; (Time Delay doubts)</h3>
          <p className={cx.body}>Problems around how long until they see results, setup time, onboarding friction, impatience.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;I need to see revenue this month, not in six.&rdquo; &middot; &ldquo;The last setup took 90 days.&rdquo; &middot; &ldquo;I don&apos;t have time to wait.&rdquo;</p>
          <AnswerArea id="problemsTime" value={wb.v('problemsTime')} onChange={(val) => wb.update('problemsTime', val)} rows={5} placeholder="List every time-related objection or friction..." />
        </div>
      </section>

      <Divider />

      {/* ══ STEP 04 — SOLUTIONS LIST ══ */}
      <section className="step-section mb-16">
        <StepBadge n={4} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Turn Problems Into Solutions
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Take every problem you listed and reverse it. Formula: <strong>&ldquo;How to [achieve X] without [problem]&rdquo;</strong>. Each line becomes a solution that belongs somewhere in your offer.
        </p>

        <h3 className={cx.h3}>Your Solutions</h3>
        <p className={cx.body}>Don&apos;t filter yet &mdash; write a solution for every problem, even if some feel small. You&apos;ll trim in Step 6.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong><br/>
        &ldquo;How to get ROI in 30 days without needing to scale ad spend&rdquo; &middot; <br/>
        &ldquo;How to launch without your team learning new software&rdquo; &middot; <br/>
        &ldquo;How to prove it works in your specific market before you commit the full spend&rdquo;</p>
        <AnswerArea id="solutionsList" value={wb.v('solutionsList')} onChange={(val) => wb.update('solutionsList', val)} rows={10} placeholder={'Reverse each problem into a "How to [outcome] without [problem]" line.\nOne per line. Aim for 15–30.'} />
      </section>

      <Divider />

      {/* ══ STEP 05 — DELIVERY & PRODUCT TYPE ══ */}
      <section className="step-section mb-16">
        <StepBadge n={5} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Delivery Mechanism &amp; Product Type
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Every solution gets delivered somehow. The same idea can be a 1:1 service, a group program, a course, a template pack, or software &mdash; with wildly different margins and price ceilings. Decide now how you&apos;ll deliver.
        </p>

        <h3 className={cx.h3}>01. Delivery Mechanism</h3>
        <p className={cx.body}>How does the client actually receive the value? Check all that apply, but circle the primary one.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Options to consider:</p>
        <ul className={cx.questions}>
          <li><strong>1:1</strong> &mdash; calls, custom builds, personal coaching (high price ceiling, low scale)</li>
          <li><strong>1:few</strong> &mdash; small group, cohort, mastermind</li>
          <li><strong>1:many</strong> &mdash; course, recorded videos, community</li>
          <li><strong>Done-for-you (DFY)</strong> &mdash; you do the work, they get the result</li>
          <li><strong>Done-with-you (DWY)</strong> &mdash; you guide, they execute</li>
          <li><strong>Self-serve</strong> &mdash; they use your product without you</li>
        </ul>
        <AnswerArea id="deliveryMechanism" value={wb.v('deliveryMechanism')} onChange={(val) => wb.update('deliveryMechanism', val)} placeholder="Primary delivery mechanism + any secondaries..." />

        <h3 className={cx.h3}>02. Product Type</h3>
        <p className={cx.body}>The wrapper around the delivery. Same mechanism can be packaged many different ways.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Options to consider:</p>
        <ul className={cx.questions}>
          <li>Consulting engagement / retainer</li>
          <li>Coaching program (3mo, 6mo, 12mo)</li>
          <li>Course + community</li>
          <li>Done-for-you build or service</li>
          <li>Software / SaaS / tool</li>
          <li>Templates / playbooks / toolkit</li>
          <li>Event, workshop, bootcamp, intensive</li>
          <li>Hybrid &mdash; service + software + community</li>
        </ul>
        <AnswerArea id="productType" value={wb.v('productType')} onChange={(val) => wb.update('productType', val)} placeholder="What form does the offer take in the market?" />
      </section>

      <Divider />

      {/* ══ STEP 06 — TRIM, STACK & BUNDLE ══ */}
      <section className="step-section mb-16">
        <StepBadge n={6} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Trim, Stack &amp; Bundle
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          You can&apos;t include everything. The offer gets built by subtracting what&apos;s expensive-but-not-valuable, adding what&apos;s cheap-but-high-value, then stacking the survivors into one bundle.
        </p>

        <h3 className={cx.h3}>01. Trim &mdash; High Cost, Same Value</h3>
        <p className={cx.body}>What&apos;s expensive to deliver but the client doesn&apos;t actually care about? Cut it. Your margin depends on this.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;Weekly 1-on-1 strategy calls eat 4 hrs/week per client. Replacing with async Loom reviews + a shared doc keeps 90% of the value at 20% of the cost.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>What takes the most of your time but the client barely references?</li>
          <li>What do you deliver out of habit, not because the client demanded it?</li>
          <li>What can become async, automated, templated, or self-serve without dropping outcome quality?</li>
        </ul>
        <AnswerArea id="trimHighCost" value={wb.v('trimHighCost')} onChange={(val) => wb.update('trimHighCost', val)} rows={5} placeholder="What can you subtract without reducing the outcome?" />

        <h3 className={cx.h3}>02. Stack &mdash; Low Cost, High Value</h3>
        <p className={cx.body}>What&apos;s cheap for you to produce once but saves the client massive time, effort, or worry forever?</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;A 20-question diagnostic template that takes 2 hours to make &mdash; saves each client 2 weeks of fumbling. Infinite leverage.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Options to consider:</p>
        <ul className={cx.questions}>
          <li>Templates, checklists, scripts, swipe files</li>
          <li>Pre-built calculators or diagnostic tools</li>
          <li>Recorded trainings that answer recurring questions once</li>
          <li>SOPs, playbooks, frameworks</li>
          <li>Community / peer introductions</li>
          <li>Pre-built integrations, automations, or starter kits</li>
        </ul>
        <AnswerArea id="addLowCostHighValue" value={wb.v('addLowCostHighValue')} onChange={(val) => wb.update('addLowCostHighValue', val)} rows={5} placeholder="What can you add that costs little but feels like a lot?" />

        <h3 className={cx.h3}>03. The Bundle</h3>
        <p className={cx.body}>Now stack the survivors. List what&apos;s in the final offer in the order the client receives it. Each line should feel like it&apos;s worth the whole price on its own.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong><br/>
        &ldquo;Week 1: Audit + custom dashboard setup (value: $3K)<br/>
        Weeks 2&ndash;4: 3x async strategy reviews + full template library (value: $5K)<br/>
        Months 2&ndash;3: Monthly optimization cycles + private Slack (value: $4K)<br/>
        Bonus: 12-point diagnostic toolkit + lifetime updates (value: $2K)&rdquo;</p>
        <AnswerArea id="bundle" value={wb.v('bundle')} onChange={(val) => wb.update('bundle', val)} rows={8} placeholder={'List everything in the final bundle, in order.\nInclude a "value" number for each line.'} />
      </section>

      <Divider />

      {/* ══ STEP 07 — ENHANCEMENTS & FINALIZE ══ */}
      <section className="step-section mb-16">
        <StepBadge n={7} />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Enhance &amp; Finalize
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          The bundle is done. Now apply the four levers that can 10x conversion without changing the product: scarcity + urgency, bonuses, guarantee, and naming. Finish with price.
        </p>

        <h3 className={cx.h3}>01. Scarcity &amp; Urgency</h3>
        <p className={cx.body}>Scarcity limits supply (how many can have it). Urgency limits time (how long to decide). Both need to be real &mdash; fake countdowns destroy trust the second someone notices.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;Only 4 spots per quarter because of onboarding capacity.&rdquo; &middot; &ldquo;This price holds through the end of the month; afterward it goes to $X.&rdquo; &middot; &ldquo;Start by [date] to hit results before your busy season.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Ask yourself:</p>
        <ul className={cx.questions}>
          <li>What&apos;s the real capacity limit &mdash; your hours, your team, your ops?</li>
          <li>Is there a real deadline (seasonal, calendar, pricing change)?</li>
          <li>What does it cost the client to wait?</li>
        </ul>
        <AnswerArea id="scarcityUrgency" value={wb.v('scarcityUrgency')} onChange={(val) => wb.update('scarcityUrgency', val)} rows={4} placeholder="Legitimate scarcity and urgency — no fake timers..." />

        <h3 className={cx.h3}>02. Bonuses</h3>
        <p className={cx.body}>Bonuses expand the perceived value without inflating your cost. The best bonuses solve one of the &ldquo;Effort&rdquo; or &ldquo;Time Delay&rdquo; problems from Step 3 &mdash; they remove a specific friction the client would otherwise face.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;Bonus: The exact onboarding script we use with new clients.&rdquo; &middot; &ldquo;Bonus: 1:1 setup call with our head of ops in week 1.&rdquo; &middot; &ldquo;Bonus: Private community of other owners in your industry.&rdquo;</p>
        <AnswerArea id="bonuses" value={wb.v('bonuses')} onChange={(val) => wb.update('bonuses', val)} rows={5} placeholder="3–5 bonuses, each solving a specific friction..." />

        <h3 className={cx.h3}>03. The Guarantee</h3>
        <p className={cx.body}>Risk reversal. The offer that says &ldquo;if this doesn&apos;t work, you don&apos;t pay&rdquo; (in whatever form is true for you) outsells the offer that says &ldquo;trust me&rdquo; every time. The stronger and more specific, the better.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Guarantee types to consider:</p>
        <ul className={cx.questions}>
          <li><strong>Unconditional:</strong> Full refund, no questions asked, within X days.</li>
          <li><strong>Conditional:</strong> Refund if they do X, Y, Z and still don&apos;t see result.</li>
          <li><strong>Outcome-based:</strong> &ldquo;We keep working until [specific outcome] &mdash; no additional cost.&rdquo;</li>
          <li><strong>Anti-guarantee:</strong> &ldquo;No refunds &mdash; we only take clients we&apos;re sure we can help. Here&apos;s how we screen.&rdquo;</li>
        </ul>
        <AnswerArea id="guarantee" value={wb.v('guarantee')} onChange={(val) => wb.update('guarantee', val)} rows={4} placeholder="The promise that makes saying no feel foolish..." />

        <h3 className={cx.h3}>04. The Name</h3>
        <p className={cx.body}>The wrapper matters. A good offer name is <strong>Magnetic, Audience-specific, result-Guaranteed, Intriguing, and Concrete</strong>. It signals who it&apos;s for and what they get in a phrase.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Examples:</strong> &ldquo;The 90-Day Revenue Rescue for Home-Service Operators&rdquo; &middot; &ldquo;Lead Velocity System&rdquo; &middot; &ldquo;The Q3 Overhaul for HVAC&rdquo;</p>
        <AnswerArea id="offerName" value={wb.v('offerName')} onChange={(val) => wb.update('offerName', val)} rows={3} placeholder="Draft 3–5 name options. Pick the one that makes the avatar lean in..." />

        <h3 className={cx.h3}>05. Pricing &amp; ROI Math</h3>
        <p className={cx.body}>Price on value, not cost. The client&apos;s decision becomes easy when the ROI math is obvious. Show the anchor, show the price, show what they get back.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Example:</strong> &ldquo;List price: $24K. Your price: $12K for founding cohort. Conservative revenue impact: $8K/mo additional = $96K/yr. ROI: 8x in year 1. Break-even: you need 1.5 additional customers/month.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Include in your answer:</p>
        <ul className={cx.questions}>
          <li>Anchor price (what a comparable DFY/competitor would charge)</li>
          <li>Your price (and payment terms &mdash; upfront, monthly, annual discount)</li>
          <li>Conservative revenue/savings impact for the client</li>
          <li>ROI multiple in year 1 (target: 3&ndash;10x)</li>
          <li>Break-even framing (&ldquo;you need X more customers to pay for this&rdquo;)</li>
        </ul>
        <AnswerArea id="pricing" value={wb.v('pricing')} onChange={(val) => wb.update('pricing', val)} rows={6} placeholder={'Anchor: $\nPrice: $\nRevenue impact: $ /mo\nROI in year 1:\nBreak-even framing:'} />
      </section>

      <WorkbookToolbar
        completedCount={wb.completedCount} totalFields={wb.totalFields} saveStatus={wb.saveStatus}
        onSave={wb.handleSave} onExport={wb.handleExport}
        onReset={() => wb.handleReset('Clear all answers? This cannot be undone.')}
        isDark={wb.isDark} onToggleDark={wb.toggleDark}
      />
    </WorkbookShell>
  );
}
