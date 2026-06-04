import type { AppConfig, BehaviorConfig, DesignTokens, Routine, StructuralConfig } from './types';
import {
  MAX_FONT_SCALE_PCT,
  MAX_GOAL_LENGTH,
  MAX_SEGMENTS_PER_HOUR,
  MIN_FONT_SCALE_PCT,
  MIN_SEGMENTS_PER_HOUR,
  createDefaultConfig,
} from './defaults';
import { MINUTES_PER_DAY } from '../engine/time';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toInt = (value: unknown, fallback: number): number => {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

const isHexColor = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());

const toBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return /^(true|1|yes|on)$/i.test(value.trim());
  return fallback;
};

/** Clamps structural config into the allowed ranges. */
export function sanitizeStructure(input: Partial<StructuralConfig> | undefined): StructuralConfig {
  const base = createDefaultConfig().structure;
  const startHour = clamp(toInt(input?.startHour, base.startHour), 0, 23);
  const endHour = clamp(toInt(input?.endHour, base.endHour), 1, 24);
  const segmentsPerHour = clamp(
    toInt(input?.segmentsPerHour, base.segmentsPerHour),
    MIN_SEGMENTS_PER_HOUR,
    MAX_SEGMENTS_PER_HOUR,
  );
  return { startHour, endHour, segmentsPerHour };
}

/** Validates each color token, falling back to defaults for invalid values. */
export function sanitizeTokens(input: Partial<DesignTokens> | undefined): DesignTokens {
  const base = createDefaultConfig().tokens;
  const out = { ...base };
  (Object.keys(base) as (keyof DesignTokens)[]).forEach((key) => {
    if (key === 'strokeGrid') {
      out.strokeGrid = clamp(toInt(input?.strokeGrid, base.strokeGrid), 0, 20);
    } else if (isHexColor(input?.[key])) {
      out[key] = (input?.[key] as string).trim();
    }
  });
  return out;
}

function sanitizeBehavior(input: Partial<BehaviorConfig> | undefined): BehaviorConfig {
  return { statusColoring: toBool(input?.statusColoring, true) };
}

/** Trims and length-caps goal strings, dropping out-of-range or empty keys. */
export function sanitizeRoutine(input: Partial<Routine> | undefined): Routine {
  const goals: Record<number, string> = {};
  const source = input?.goals ?? {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = Number(rawKey);
    if (!Number.isInteger(key) || key < 0 || key >= MINUTES_PER_DAY) continue;
    if (typeof rawValue !== 'string') continue;
    const value = rawValue.trim().slice(0, MAX_GOAL_LENGTH);
    if (value.length > 0) goals[key] = value;
  }
  return { goals };
}

/**
 * Coerces an unknown, possibly-malformed object into a valid {@link AppConfig}.
 * Used when loading from storage and when importing CSV, to guarantee the app
 * never boots into a broken state.
 */
export function sanitizeConfig(input: unknown): AppConfig {
  const base = createDefaultConfig();
  if (typeof input !== 'object' || input === null) return base;
  const raw = input as Partial<AppConfig>;

  const completedSource = Array.isArray(raw.completion?.completed) ? raw.completion!.completed : [];
  const completed = completedSource
    .map((n) => toInt(n, -1))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < MINUTES_PER_DAY);

  return {
    version: base.version,
    structure: sanitizeStructure(raw.structure),
    tokens: sanitizeTokens(raw.tokens),
    fontScalePct: clamp(
      toInt(raw.fontScalePct, base.fontScalePct),
      MIN_FONT_SCALE_PCT,
      MAX_FONT_SCALE_PCT,
    ),
    behavior: sanitizeBehavior(raw.behavior),
    routines: { default: sanitizeRoutine(raw.routines?.default) },
    completion: {
      windowDate: typeof raw.completion?.windowDate === 'string' ? raw.completion.windowDate : '',
      completed,
    },
  };
}

export { isHexColor };
