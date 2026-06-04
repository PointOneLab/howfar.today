import type { StructuralConfig } from '../model/types';

export const MINUTES_PER_DAY = 1440;

/** Pads a number to a 2-digit, zero-prefixed string. */
export function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Formats a minute-of-day value (0–1439) as an "HH:MM" clock label. */
export function formatClock(minuteOfDay: number): string {
  const m = ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

/** Formats seconds as "MM:SS" (minutes may exceed 59). */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
}

/**
 * Total length of the day window, in hours.
 *
 * The window may cross midnight and spans up to — but never beyond — 24 hours.
 * `endHour === startHour` (e.g. 4 → 4) is treated as a full 24-hour day, as is
 * `start 0, end 24`.
 */
export function durationHours({ startHour, endHour }: StructuralConfig): number {
  const endNorm = endHour % 24;
  const diff = (endNorm - startHour + 24) % 24;
  return diff === 0 ? 24 : diff;
}

/** Length in minutes of a single sub-segment for the given structure. */
export function intervalMinutes({ segmentsPerHour }: StructuralConfig): number {
  return 60 / segmentsPerHour;
}

/** Total number of segments across the whole window. */
export function segmentCount(structure: StructuralConfig): number {
  return durationHours(structure) * structure.segmentsPerHour;
}

/** Window start, expressed as minute of day (0–1439). */
export function windowStartMinute({ startHour }: StructuralConfig): number {
  return startHour * 60;
}

/** Window length in minutes. */
export function windowDurationMinutes(structure: StructuralConfig): number {
  return durationHours(structure) * 60;
}

/** Minute-of-day for "now", including a fractional seconds component. */
export function minuteOfDayFromDate(now: Date): number {
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

export interface WindowPosition {
  /** Where now falls relative to the window. */
  phase: 'before' | 'in' | 'after';
  /**
   * Minutes elapsed from the window start to now, when `phase === 'in'`.
   * `null` when outside the window.
   */
  offsetMinutes: number | null;
  /**
   * The calendar date (local) on which the current window instance started.
   * Used as the daily-reset key for completion state. `null` when outside.
   */
  windowStartDate: Date | null;
}

/**
 * Locates `now` within the configured day window, transparently handling
 * windows that started on the previous calendar day (cross-midnight routines).
 */
export function locateWindow(structure: StructuralConfig, now: Date): WindowPosition {
  const startMin = windowStartMinute(structure);
  const durMin = windowDurationMinutes(structure);
  const nowMin = minuteOfDayFromDate(now);

  // Offset from the most recent occurrence of the start hour, in [0, 1440).
  // When now is earlier in the clock than the start hour, the relevant window
  // began on the previous calendar day (handles cross-midnight routines).
  let offset = nowMin - startMin;
  let dayShift = 0;
  if (offset < 0) {
    offset += MINUTES_PER_DAY;
    dayShift = -1;
  }

  if (offset < durMin) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + dayShift);
    return { phase: 'in', offsetMinutes: offset, windowStartDate: start };
  }

  // Outside the window. Split the dead-zone at its midpoint: nearer the next
  // start reads as "not started yet"; nearer the last end reads as "complete".
  const timeSinceEnd = offset - durMin;
  const timeUntilNextStart = MINUTES_PER_DAY - offset;
  const phase = timeUntilNextStart <= timeSinceEnd ? 'before' : 'after';
  return { phase, offsetMinutes: null, windowStartDate: null };
}

/** Formats a Date as a local ISO date string (YYYY-MM-DD). */
export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
