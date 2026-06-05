import type { AppConfig, DesignTokens, StructuralConfig } from './types';

/** Current persisted-schema version. Bump when the shape changes. */
export const CONFIG_VERSION = 1;

/** Maximum length of a single goal string (enforced on edit, import, and share). */
export const MAX_GOAL_LENGTH = 50;

export const MAX_PROFILE_NAME_LENGTH = 40;

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
export const MIN_FONT_SCALE_PCT = 0;
export const MAX_FONT_SCALE_PCT = 200;

export const DEFAULT_TIME_SCALE_PCT = 28;
export const MIN_TIME_SCALE_PCT = 0;
export const MAX_TIME_SCALE_PCT = 200;

export const DEFAULT_SEGMENT_GAP = 0.6;
export const MIN_SEGMENT_GAP = 0;
export const MAX_SEGMENT_GAP = 3;

export const DEFAULT_CHECK_SCALE_PCT = 100;
export const MIN_CHECK_SCALE_PCT = 0;
export const MAX_CHECK_SCALE_PCT = 200;

export const DEFAULT_FOCUS_GOAL_SCALE_PCT = 100;
export const DEFAULT_FOCUS_META_SCALE_PCT = 100;
export const DEFAULT_FOCUS_CHECK_SCALE_PCT = 100;
export const MIN_FOCUS_SCALE_PCT = 0;
export const MAX_FOCUS_SCALE_PCT = 200;

export const DEFAULT_SEGMENT_GAP_RATIO = 50;
export const MIN_SEGMENT_GAP_RATIO = 0;
export const MAX_SEGMENT_GAP_RATIO = 200;

export const DEFAULT_MASK_OPACITY_PCT = 60;
export const MIN_MASK_OPACITY_PCT = 0;
export const MAX_MASK_OPACITY_PCT = 100;

export const DEFAULT_MOTION_EASING = 'ease-out';
export const MOTION_EASING_OPTIONS = ['linear', 'ease-out', 'ease-in-out', 'ease-in'] as const;
export type MotionEasing = (typeof MOTION_EASING_OPTIONS)[number];

export const DEFAULT_PROFILE_NAME = '';

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
    checkScalePct: DEFAULT_CHECK_SCALE_PCT,
    focusGoalScalePct: DEFAULT_FOCUS_GOAL_SCALE_PCT,
    focusMetaScalePct: DEFAULT_FOCUS_META_SCALE_PCT,
    focusCheckScalePct: DEFAULT_FOCUS_CHECK_SCALE_PCT,
    segmentGap: DEFAULT_SEGMENT_GAP,
    segmentGapRatio: DEFAULT_SEGMENT_GAP_RATIO,
    maskOpacityPct: DEFAULT_MASK_OPACITY_PCT,
    motionEasing: DEFAULT_MOTION_EASING,
    profileName: DEFAULT_PROFILE_NAME,
    behavior: { statusColoring: true },
    routines: { default: { goals: {} } },
    completion: { windowDate: '', completed: [] },
  };
}
