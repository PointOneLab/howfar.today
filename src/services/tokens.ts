import type { DesignTokens } from '@/core/model/types';

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
  fontScalePct: number;
  timeScalePct: number;
  segmentGapRatio: number;
  checkScalePct: number;
  focusGoalScalePct: number;
  focusMetaScalePct: number;
  focusCheckScalePct: number;
}

export function applyTokens(tokens: DesignTokens, scales: LayoutScales): void {
  const root = document.documentElement;
  (Object.keys(CSS_VAR) as (keyof DesignTokens)[]).forEach((key) => {
    const value = tokens[key];
    const cssValue = key === 'strokeGrid' ? `${value}px` : String(value);
    root.style.setProperty(CSS_VAR[key], cssValue);
  });
  root.style.setProperty('--font-scale-goal', String(scales.fontScalePct / 100));
  root.style.setProperty('--font-scale-time', String(scales.timeScalePct / 100));
  const gapBase = (scales.fontScalePct / 100) * (scales.segmentGapRatio / 100);
  root.style.setProperty('--segment-gap', `${gapBase}em`);
  root.style.setProperty('--check-scale', String(scales.checkScalePct / 100));
  root.style.setProperty('--focus-goal-scale', String(scales.focusGoalScalePct / 100));
  root.style.setProperty('--focus-meta-scale', String(scales.focusMetaScalePct / 100));
  root.style.setProperty('--focus-check-scale', String(scales.focusCheckScalePct / 100));
}
