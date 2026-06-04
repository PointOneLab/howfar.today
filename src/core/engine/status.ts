import type { AppConfig, DayPhase, Segment, SegmentState, StructuralConfig } from '../model/types';
import { buildSegments } from './segments';
import { intervalMinutes, locateWindow } from './time';
import { resolveRoutine } from './routine';

/** A segment paired with everything the UI needs to render it. */
export interface SegmentView {
  segment: Segment;
  goal: string;
  state: SegmentState;
  /** Whether the goal input may be edited. Goals are editable in every state. */
  editable: boolean;
  /** Whether completion may be toggled (active or past segments, in-window). */
  completable: boolean;
  /** Whether this is the single active segment right now. */
  isActive: boolean;
  /** Whether this segment is marked completed. */
  isCompleted: boolean;
}

/** A complete, time-resolved view of the day. */
export interface DayView {
  phase: DayPhase;
  /** Index of the active segment, or `null` when outside the window. */
  activeIndex: number | null;
  /** Elapsed fraction (0–1) of the active segment, or 0 when none. */
  activeProgress: number;
  /** Whole-segment views in chronological order. */
  segments: SegmentView[];
  /** The currently active segment view, if any. */
  active: SegmentView | null;
}

/** Computes the active segment index and its elapsed fraction. */
export function locateActive(
  structure: StructuralConfig,
  now: Date,
): { phase: DayPhase; activeIndex: number | null; progress: number } {
  const position = locateWindow(structure, now);
  if (position.phase !== 'in' || position.offsetMinutes === null) {
    return { phase: position.phase, activeIndex: null, progress: 0 };
  }

  const interval = intervalMinutes(structure);
  const activeIndex = Math.floor(position.offsetMinutes / interval);
  const progress = (position.offsetMinutes - activeIndex * interval) / interval;
  return { phase: 'in', activeIndex, progress: Math.min(1, Math.max(0, progress)) };
}

/**
 * Determines a single segment's render state.
 *
 * The status-coloring switch governs BOTH success and failure colors: when off,
 * completed segments and missed segments alike fall back to neutral states.
 */
export function segmentState(
  segment: Segment,
  phase: DayPhase,
  activeIndex: number | null,
  isCompleted: boolean,
  statusColoring: boolean,
): SegmentState {
  if (phase === 'before') return 'future';

  const isActive = phase === 'in' && activeIndex !== null && segment.index === activeIndex;
  const isFuture = phase === 'in' && activeIndex !== null && segment.index > activeIndex;

  if (isCompleted) {
    if (statusColoring) return 'completed';
    return isActive ? 'active' : 'past';
  }

  if (isActive) return 'active';
  if (isFuture) return 'future';

  // Past (elapsed within the window, or the whole day has ended).
  return statusColoring ? 'failed' : 'past';
}

/** Whether completion may be toggled: active or past segments while in-window. */
function isCompletable(segment: Segment, phase: DayPhase, activeIndex: number | null): boolean {
  return phase === 'in' && activeIndex !== null && segment.index <= activeIndex;
}

/** Builds the full {@link DayView} from configuration and the current time. */
export function buildDayView(config: AppConfig, now: Date): DayView {
  const segments = buildSegments(config.structure);
  const routine = resolveRoutine(config, now);
  const completed = new Set(config.completion.completed);
  const { phase, activeIndex, progress } = locateActive(config.structure, now);

  const views: SegmentView[] = segments.map((segment) => {
    const isCompleted = completed.has(segment.minuteOfDay);
    return {
      segment,
      goal: routine.goals[segment.minuteOfDay] ?? '',
      state: segmentState(segment, phase, activeIndex, isCompleted, config.behavior.statusColoring),
      editable: true,
      completable: isCompletable(segment, phase, activeIndex),
      isActive: phase === 'in' && segment.index === activeIndex,
      isCompleted,
    };
  });

  return {
    phase,
    activeIndex,
    activeProgress: progress,
    segments: views,
    active: activeIndex !== null ? (views[activeIndex] ?? null) : null,
  };
}
