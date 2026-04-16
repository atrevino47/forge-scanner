export const revenueAuditCopy = {
  productName: 'Revenue Audit',

  landing: {
    heroHeadline: 'Get your Revenue Audit',
    heroSubheadline:
      "See exactly where your funnel is leaking — and what it's costing you each month.",
    urlPlaceholder: 'yourwebsite.com',
    urlCta: 'Start My Revenue Audit',
  },

  scan: {
    inProgressHeadline: 'Running your Revenue Audit',
    inProgressBody:
      "We're capturing your site across five funnel stages. This takes about 60 seconds.",
    socialsHeadline: 'While we work — tell us about your socials',
    socialsBody:
      "Optional. Helps us evaluate your social presence. Skip if you'd rather not.",
    socialsSkip: 'Skip',
    socialsSubmit: 'Add to audit',
  },

  emailGate: {
    headline: 'Unlock your full Revenue Audit',
    body: 'Enter your email to see all findings, your revenue impact estimate, and the fix list.',
    emailPlaceholder: 'you@company.com',
    passwordAdd: 'Add a password (optional)',
    passwordRemove: 'Use magic link instead',
    submitMagicLink: 'Send me the link',
    submitPassword: 'Create my account',
    checkEmail: 'Check your email for the magic link.',
  },

  beats: {
    scoreReveal: { label: 'Your Revenue Audit score' },
    situation: { label: 'The situation' },
    complication: { label: 'The gap' },
    evidence: { label: 'What we found' },
    pattern: { label: 'The pattern' },
    impact: { label: 'Revenue impact' },
    cta: {
      headline: 'Ready to fix this?',
      body: 'Book a 30-minute strategy call. Adrián walks you through the fixes.',
      button: 'Book my strategy call',
    },
  },
} as const;
