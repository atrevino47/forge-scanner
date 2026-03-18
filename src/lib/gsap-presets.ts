/**
 * GSAP animation preset factories.
 *
 * Each preset returns a { from, vars } config object
 * for use with gsap.fromTo() or timeline.fromTo().
 *
 * Usage:
 *   const { from, vars } = clipReveal({ delay: 0.2 });
 *   gsap.fromTo(el, from, vars);
 */

import gsap from 'gsap';

interface PresetConfig {
  from: gsap.TweenVars;
  vars: gsap.TweenVars;
}

/** Clip-path wipe reveal — use for headlines */
export function clipReveal(overrides?: gsap.TweenVars): PresetConfig {
  return {
    from: { clipPath: 'inset(0 0 100% 0)' },
    vars: {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.8,
      ease: 'power3.out',
      ...overrides,
    },
  };
}

/** Fade up from below — use for body text, inputs, badges */
export function fadeSlideUp(overrides?: gsap.TweenVars): PresetConfig {
  return {
    from: { opacity: 0, y: 40 },
    vars: {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      ...overrides,
    },
  };
}

/** Scale in from slightly smaller — use for cards, panels */
export function scaleIn(overrides?: gsap.TweenVars): PresetConfig {
  return {
    from: { opacity: 0, scale: 0.92 },
    vars: {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'power2.out',
      ...overrides,
    },
  };
}

/** Fade in from the left — use for horizontal reveals */
export function fadeSlideRight(overrides?: gsap.TweenVars): PresetConfig {
  return {
    from: { opacity: 0, x: -30 },
    vars: {
      opacity: 1,
      x: 0,
      duration: 0.6,
      ease: 'power2.out',
      ...overrides,
    },
  };
}
