'use client';

import { useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { clipReveal, fadeSlideUp } from '@/lib/gsap-presets';

const faqs = [
  {
    question: 'Is it really free?',
    answer:
      "Yes. The full scan, AI annotations, and funnel blueprint are completely free. No credit card, no trial. We make money when you hire Forge to fix what we find.",
  },
  {
    question: 'What exactly do you scan?',
    answer:
      "We capture real screenshots of your website, Google Business Profile, social media pages (Instagram, Facebook, TikTok), and any active ads. Our AI analyzes each one against proven funnel principles.",
  },
  {
    question: 'How does the AI analysis work?',
    answer:
      "We use Claude (Anthropic's AI) to visually analyze each screenshot. It identifies specific issues — missing CTAs, weak headlines, broken trust signals — and marks them directly on the screenshots with numbered annotations.",
  },
  {
    question: 'Do I need to create an account?',
    answer:
      "No account needed to start. We'll ask for your email mid-scan so we can send you the full results and blueprint. That's it.",
  },
  {
    question: 'What happens after the scan?',
    answer:
      "You get a complete audit of your funnel with a prioritized fix list and an optimized blueprint mockup. Our AI Sales Agent will walk you through the findings and help you decide if a strategy call makes sense.",
  },
  {
    question: 'How long does the scan take?',
    answer:
      "Most scans complete in under 60 seconds. Complex sites with multiple social profiles may take up to 90 seconds.",
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
    <section
      ref={containerRef}
      className="relative px-6 py-24 sm:py-32"
      style={{ background: '#FAFAF7' }}
    >
      <div className="mx-auto max-w-[720px]">
        <h2
          data-faq="headline"
          className="mb-16 text-center font-display font-bold"
          style={{
            fontSize: 'clamp(1.75rem, 3vw + 0.5rem, 2.75rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            color: '#1A1917',
          }}
        >
          Common Questions
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
  const plusRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!contentRef.current || !plusRef.current) return;

      if (isOpen) {
        gsap.to(plusRef.current, { rotation: 45, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(
          contentRef.current,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' },
        );
      } else {
        gsap.to(plusRef.current, { rotation: 0, duration: 0.3, ease: 'power2.out' });
        gsap.to(contentRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
      }
    },
    { dependencies: [isOpen] },
  );

  return (
    <div
      data-faq="item"
      className="border-b"
      style={{ borderColor: '#ECEAE4' }}
    >
      <button onClick={onToggle} className="flex w-full items-center justify-between py-5 text-left">
        {/* Question — Outfit weight 600 text-lg */}
        <span
          className="pr-4 font-display text-lg font-semibold"
          style={{ color: '#1A1917' }}
        >
          {question}
        </span>
        {/* Plus/minus toggle */}
        <span
          ref={plusRef}
          className="flex h-5 w-5 shrink-0 items-center justify-center text-lg font-light leading-none"
          style={{ color: '#B8B5AD' }}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        {/* Answer — Space Grotesk text-sm color #6B6860 */}
        <p
          className="pb-5 font-body text-sm"
          style={{ lineHeight: 1.65, color: '#6B6860' }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}
