/**
 * Design tokens — single source of truth for all visual values.
 * Brand v2: Light mode primary, Forge Orange, Outfit + Space Grotesk + JetBrains Mono
 * CSS variables are defined in globals.css; this file provides
 * typed JS references for use in components and GSAP animations.
 */

export const t = {
  color: {
    // Light mode (primary — public facing)
    base: '#FAFAF7',
    surface: '#F5F4F0',
    container: '#F5F4F0',
    card: '#ECEAE4',
    elevated: '#E2E0DA',

    // Accent
    accent: '#E8530E',
    accentBright: '#FF6B2B',
    accentDark: '#C4410A',
    accentGlow: 'rgba(232, 83, 14, 0.1)',
    accentHover: '#FF6B2B',

    // Text
    text: '#1A1917',
    textSecondary: '#6B6860',
    textMuted: '#B8B5AD',

    // Borders
    border: '#ECEAE4',
    borderWarm: 'rgba(232, 83, 14, 0.04)',

    // Glass
    glass: 'rgba(250, 250, 247, 0.92)',
    glassBorder: '#ECEAE4',

    // Semantic
    critical: '#D93636',
    criticalBg: 'rgba(217, 54, 54, 0.06)',
    warning: '#D4890A',
    warningBg: 'rgba(212, 137, 10, 0.06)',
    positive: '#2D8C4E',
    positiveBg: 'rgba(45, 140, 78, 0.06)',
    opportunity: '#2B7BD4',
    opportunityBg: 'rgba(43, 123, 212, 0.06)',

    // Dark mode (complement — tool interfaces like admin, chat)
    dark: {
      base: '#141413',
      surface: '#1E1E1C',
      card: '#282826',
      elevated: '#353533',
      text: '#F0EFE9',
      muted: '#9A9890',
      border: 'rgba(255, 107, 43, 0.12)',
    },
  },
  font: {
    display: "'Outfit', sans-serif",
    body: "'Space Grotesk', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  layout: {
    contentMaxWidth: '960px',
    cardGridMaxWidth: '1120px',
    sectionPaddingY: '80px',
  },
  typography: {
    displayTracking: '-0.02em',
    displayLeading: 1.08,
    bodyLeading: 1.65,
  },
  radius: '12px',
} as const;
