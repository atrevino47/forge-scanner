'use client';

import { type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/* Register GSAP plugins once at module level (per CLAUDE.md Rule 8).
 * All child components can use ScrollTrigger without re-registering. */
gsap.registerPlugin(ScrollTrigger, useGSAP);

export function GSAPProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
