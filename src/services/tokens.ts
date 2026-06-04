import type { DesignTokens } from '@/core/model/types';

/** Maps each design token to its CSS custom property name. */
const CSS_VAR: Record<keyof DesignTokens, string> = {
  bgApp: '--bg-app',
  colorRegular: '--color-regular',
  colorHighlight: '--color-highlight',
  colorInteract: '--color-interact',
  colorSecondary: '--color-secondary',
  colorSuccess: '--color-success',
  colorFailure: '--color-failure',
  colorProgress: '--color-progress',
  colorVoid: '--color-void',
  colorGrid: '--color-grid',
  strokeGrid: '--stroke-grid',
};

export interface LayoutScales {
  /** Goal-text height as a percentage of segment height. */
  fontScalePct: number;
  /** Time-indicator height as a percentage of segment height. */
  timeScalePct: number;
  /** Horizontal gap/padding inside a segment, in vw. */
  segmentGap: number;
}

/**
 * Pushes design tokens and layout scales onto the document root as CSS custom
 * properties, enabling live, runtime theming from the settings panel.
 */
export function applyTokens(tokens: DesignTokens, scales: LayoutScales): void {
  const root = document.documentElement;
  (Object.keys(CSS_VAR) as (keyof DesignTokens)[]).forEach((key) => {
    const value = tokens[key];
    const cssValue = key === 'strokeGrid' ? `${value}px` : String(value);
    root.style.setProperty(CSS_VAR[key], cssValue);
  });
  root.style.setProperty('--font-scale-goal', String(scales.fontScalePct / 100));
  root.style.setProperty('--font-scale-time', String(scales.timeScalePct / 100));
  root.style.setProperty('--segment-gap', `${scales.segmentGap}vw`);
}
