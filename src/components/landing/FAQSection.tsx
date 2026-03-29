'use client';

import { useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronDown } from 'lucide-react';
import { clipReveal, fadeSlideUp } from '@/lib/gsap-presets';

const faqs = [
  {
    question: 'What exactly does the scanner check?',
    answer: 'We analyze 5 stages of your sales funnel: traffic sources (social profiles, ads, SEO), landing experience (homepage, mobile, speed), lead capture (forms, CTAs, lead magnets), your offer (pricing, social proof, guarantees), and follow-up systems (email, retargeting, reviews). Each stage gets a score and specific improvement recommendations.',
  },
  {
    question: 'Is it really free?',
    answer: 'Yes. The full scan, AI annotations, and funnel blueprint are 100% free — no credit card, no trial period. We built this as our portfolio piece. If you want us to implement the fixes, that\'s what the strategy call is for.',
  },
  {
    question: 'How long does a scan take?',
    answer: 'About 60 seconds. We capture real screenshots, run AI analysis on each one, and generate your blueprint. You\'ll see results streaming in as each stage completes.',
  },
  {
    question: 'What happens on the strategy call?',
    answer: 'A free 30-minute session with Adrian where we walk through your scan results, prioritize fixes by impact, and map out an implementation plan. No pitch — you\'ll leave with a concrete action plan either way.',
  },
  {
    question: 'Can you scan any website?',
    answer: 'We can scan any publicly accessible website. We also detect and analyze linked social profiles (Instagram, Facebook, TikTok, LinkedIn), Google Business Profile, and active ads.',
  },
];

export function FAQSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /* ANIMATION SEQUENCE (scroll-triggered at top 80% viewport):
   * Beat 1 (0.00s): Section headline — clipReveal
   * Beat 2 (0.20s): FAQ items — fadeSlideUp with 100ms stagger
   */
  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });

      const headline = clipReveal();
      tl.fromTo('[data-faq="headline"]', headline.from, headline.vars, 0);

      const items = fadeSlideUp({ stagger: 0.1 });
      tl.fromTo('[data-faq="item"]', items.from, items.vars, 0.2);
    },
    { scope: containerRef },
  );

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section ref={containerRef} className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[960px]">
        <h2
          data-faq="headline"
          className="mb-16 text-center font-display font-bold"
          style={{
            fontSize: 'clamp(2rem, 3vw + 0.5rem, 3rem)',
            letterSpacing: '-0.02em',
            color: 'var(--forge-text)',
          }}
        >
          Questions
        </h2>

        <div>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => handleToggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (!contentRef.current || !chevronRef.current) return;

      if (isOpen) {
        gsap.to(chevronRef.current, { rotation: 180, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(
          contentRef.current,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' },
        );
      } else {
        gsap.to(chevronRef.current, { rotation: 0, duration: 0.3, ease: 'power2.out' });
        gsap.to(contentRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
      }
    },
    { dependencies: [isOpen] },
  );

  return (
    <div
      data-faq="item"
      className="border-b"
      style={{ borderColor: 'var(--forge-border)' }}
    >
      <button onClick={onToggle} className="flex w-full items-center justify-between py-5 text-left">
        <span
          className="pr-4 font-body text-base font-medium"
          style={{ color: 'var(--forge-text)' }}
        >
          {question}
        </span>
        <ChevronDown
          ref={chevronRef}
          className="h-5 w-5 shrink-0"
          style={{ color: 'var(--forge-text-muted)' }}
        />
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <p
          className="pb-5 font-body text-sm"
          style={{ lineHeight: 1.65, color: 'var(--forge-text-secondary)' }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}
