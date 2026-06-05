/**
 * Domain model for howfar.today.
 *
 * These types are intentionally framework-agnostic. Nothing here imports React,
 * the store, or any rendering concern. The shapes are designed so future
 * capabilities (per-weekday routines, cloud sync, multi-user) can be layered in
 * without reworking the engine.
 */

/** Structural parameters that define the shape of the day grid. */
export interface StructuralConfig {
  /** Inclusive start hour of the day window. Range 0–23. */
  startHour: number;
  /**
   * Exclusive end hour of the day window. Range 1–24, where 24 represents
   * midnight. The window may cross midnight (e.g. start 22, end 6) and may span
   * up to — but never beyond — 24 hours (e.g. start 4, end 4 === full day).
   */
  endHour: number;
  /** Number of equal sub-segments each hour row is divided into. Range 1–6. */
  segmentsPerHour: number;
}

/** Visual design tokens. String values are any CSS color; stroke is numeric. */
export interface DesignTokens {
  /** App background canvas. */
  bgApp: string;
  /** Standard text display. */
  colorRegular: string;
  /** Focused / active states. */
  colorHighlight: string;
  /** Clickable items / inputs. */
  colorInteract: string;
  /** Muted time indicators and secondary details. */
  colorSecondary: string;
  /** Completed segment progress background. */
  colorSuccess: string;
  /** Failed segment progress background. */
  colorFailure: string;
  /** Active running progress track fill. */
  colorProgress: string;
  /** Unreached future segment background. */
  colorVoid: string;
  /** Grid structural dividing lines. */
  colorGrid: string;
  /** Grid line thickness, in CSS pixels (kept crisp; applied as px). */
  strokeGrid: number;
}

/** Behavioural switches. */
export interface BehaviorConfig {
  /**
   * When true, uncompleted past segments adopt the failure color. Per product
   * definition an empty (unplanned) past segment also counts as failed.
   */
  statusColoring: boolean;
}

/** A single day routine: a map of segment-start (minute of day) -> goal text. */
export interface Routine {
  goals: Record<number, string>;
}

/**
 * A set of routines. MVP ships a single shared routine under `default`.
 * The shape is forward-compatible: per-weekday routines (mon–sun) can be added
 * later and resolved by {@link import('../engine/routine').resolveRoutine}.
 */
export interface RoutineSet {
  default: Routine;
}

/** Daily-resetting completion state, scoped to the active routine window. */
export interface CompletionState {
  /** ISO date (YYYY-MM-DD) identifying the routine window instance. */
  windowDate: string;
  /** Minute-of-day keys of segments marked completed within that window. */
  completed: number[];
}

/** The full persisted application state. */
export interface AppConfig {
  /** Schema version, used to migrate persisted data. */
  version: number;
  structure: StructuralConfig;
  tokens: DesignTokens;
  /** Goal-text height as a percentage of segment height. */
  fontScalePct: number;
  /** Time-indicator height as a percentage of segment height. */
  timeScalePct: number;
  /** Checkmark size relative to goal text (%). */
  checkScalePct: number;
  /** Focus goal text scale (% of default vh sizing). */
  focusGoalScalePct: number;
  /** Focus countdown meta scale (%). */
  focusMetaScalePct: number;
  /** Focus check control scale (%). */
  focusCheckScalePct: number;
  /** Legacy vw gap fallback; gap is primarily derived from goal text scale × ratio. */
  segmentGap: number;
  /** Multiplier on text-derived horizontal gap. Range 0–200 (%). */
  segmentGapRatio: number;
  /** Peak swipe mask darkness, 0–100 (% of black overlay). */
  maskOpacityPct: number;
  /** Shared easing id for scroll feel and mask interpolation. */
  motionEasing: string;
  /** Short label for exports and share URLs (max 40 chars). */
  profileName: string;
  behavior: BehaviorConfig;
  routines: RoutineSet;
  completion: CompletionState;
}

/** A single computed grid segment derived from {@link StructuralConfig}. */
export interface Segment {
  /** Sequential position within the window, 0-based. */
  index: number;
  /** Which hour row this segment belongs to, 0-based. */
  hourIndex: number;
  /** Position within the hour row, 0-based. */
  subIndex: number;
  /** Clock hour of the segment start, 0–23. */
  clockHour: number;
  /** Minute within the hour of the segment start (0, 15, 30 …). */
  startMinute: number;
  /** Stable identifier: minute of day of the segment start, 0–1439. */
  minuteOfDay: number;
  /** Minutes elapsed from the window start to this segment's start. */
  offsetMinutes: number;
  /** Length of the segment in minutes. */
  durationMinutes: number;
  /** Passive label: 2-digit hour for the first sub-segment, else 2-digit minute. */
  label: string;
  /** Human start label, e.g. "07:15". */
  startLabel: string;
  /** Human end label, e.g. "07:30". */
  endLabel: string;
}

/** Where "now" falls relative to the configured day window. */
export type DayPhase = 'before' | 'in' | 'after';

/** Rendering state of a segment relative to the current moment. */
export type SegmentState = 'future' | 'active' | 'completed' | 'failed' | 'past';
