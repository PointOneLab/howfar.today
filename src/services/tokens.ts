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

/**
 * Pushes design tokens and the font-scale ratio onto the document root as CSS
 * custom properties, enabling live, runtime theming from the settings panel.
 */
export function applyTokens(tokens: DesignTokens, fontScalePct: number): void {
  const root = document.documentElement;
  (Object.keys(CSS_VAR) as (keyof DesignTokens)[]).forEach((key) => {
    const value = tokens[key];
    const cssValue = key === 'strokeGrid' ? `${value}px` : String(value);
    root.style.setProperty(CSS_VAR[key], cssValue);
  });
  root.style.setProperty('--font-scale', String(fontScalePct / 100));
}
