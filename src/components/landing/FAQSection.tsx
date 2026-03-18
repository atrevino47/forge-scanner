'use client';

import { useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronDown } from 'lucide-react';
import { clipReveal, fadeSlideUp } from '@/lib/gsap-presets';

const faqs = [
  { question: '[COPY: FAQ question 1]', answer: '[COPY: FAQ answer 1]' },
  { question: '[COPY: FAQ question 2]', answer: '[COPY: FAQ answer 2]' },
  { question: '[COPY: FAQ question 3]', answer: '[COPY: FAQ answer 3]' },
  { question: '[COPY: FAQ question 4]', answer: '[COPY: FAQ answer 4]' },
  { question: '[COPY: FAQ question 5]', answer: '[COPY: FAQ answer 5]' },
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
          className="font-display mb-16 text-center tracking-display leading-display"
          style={{ fontSize: 'clamp(2rem, 3vw + 0.5rem, 3rem)' }}
        >
          [COPY: FAQ section title]
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
    <div data-faq="item" className="border-b border-forge-border">
      <button onClick={onToggle} className="flex w-full items-center justify-between py-5 text-left">
        <span className="pr-4 font-body text-base font-medium text-forge-text">{question}</span>
        <ChevronDown ref={chevronRef} className="h-5 w-5 shrink-0 text-forge-text-muted" />
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <p className="pb-5 font-body text-sm leading-body text-forge-text-muted">{answer}</p>
      </div>
    </div>
  );
}
