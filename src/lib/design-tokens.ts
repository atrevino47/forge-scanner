/**
 * Design tokens — single source of truth for all visual values.
 * CSS variables are defined in globals.css; this file provides
 * typed JS references for use in components and GSAP animations.
 */

export const t = {
  color: {
    base: '#0B1120',
    surface: '#0F172A',
    surfaceElevated: '#1E293B',
    accent: '#D4A537',
    accentHover: '#E5B84A',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: 'rgba(212, 165, 55, 0.12)',
    glass: 'rgba(30, 41, 59, 0.5)',
    glassBorder: 'rgba(212, 165, 55, 0.12)',
    critical: '#EF4444',
    warning: '#F59E0B',
    opportunity: '#3B82F6',
    positive: '#22C55E',
  },
  font: {
    display: '"Instrument Serif", serif',
    body: '"Plus Jakarta Sans", sans-serif',
    mono: '"JetBrains Mono", monospace',
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
} as const;
