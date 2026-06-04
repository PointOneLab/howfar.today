import type { AppConfig, DesignTokens, StructuralConfig } from './types';

/** Current persisted-schema version. Bump when the shape changes. */
export const CONFIG_VERSION = 1;

/** Maximum length of a single goal string (enforced on edit and import). */
export const MAX_GOAL_LENGTH = 200;

export const DEFAULT_STRUCTURE: StructuralConfig = {
  startHour: 7,
  endHour: 24,
  segmentsPerHour: 4,
};

/**
 * Default flat-minimalist dark palette. Deliberately restrained: a near-black
 * canvas, soft neutral text, and a small set of functional accent colors.
 */
export const DEFAULT_TOKENS: DesignTokens = {
  bgApp: '#0a0a0a',
  colorRegular: '#e6e6e6',
  colorHighlight: '#ffffff',
  colorInteract: '#7aa2f7',
  colorSecondary: '#5c5c5c',
  colorSuccess: '#3ddc84',
  colorFailure: '#f7768e',
  colorProgress: '#2a2a2a',
  colorVoid: '#141414',
  colorGrid: '#1f1f1f',
  strokeGrid: 1,
};

export const DEFAULT_FONT_SCALE_PCT = 50;
export const MIN_FONT_SCALE_PCT = 25;
export const MAX_FONT_SCALE_PCT = 75;

export const DEFAULT_TIME_SCALE_PCT = 28;
export const MIN_TIME_SCALE_PCT = 10;
export const MAX_TIME_SCALE_PCT = 60;

export const DEFAULT_SEGMENT_GAP = 0.6;
export const MIN_SEGMENT_GAP = 0;
export const MAX_SEGMENT_GAP = 3;

export const MIN_SEGMENTS_PER_HOUR = 1;
export const MAX_SEGMENTS_PER_HOUR = 6;

/** Builds a fresh default configuration. */
export function createDefaultConfig(): AppConfig {
  return {
    version: CONFIG_VERSION,
    structure: { ...DEFAULT_STRUCTURE },
    tokens: { ...DEFAULT_TOKENS },
    fontScalePct: DEFAULT_FONT_SCALE_PCT,
    timeScalePct: DEFAULT_TIME_SCALE_PCT,
    segmentGap: DEFAULT_SEGMENT_GAP,
    behavior: { statusColoring: true },
    routines: { default: { goals: {} } },
    completion: { windowDate: '', completed: [] },
  };
}
