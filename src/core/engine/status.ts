import type { AppConfig, DayPhase, Segment, SegmentState, StructuralConfig } from '../model/types';
import { buildSegments } from './segments';
import { intervalMinutes, locateWindow } from './time';
import { resolveRoutine } from './routine';

/** A segment paired with everything the UI needs to render it. */
export interface SegmentView {
  segment: Segment;
  goal: string;
  state: SegmentState;
  /** Whether the goal input may be edited (future & present, not past). */
  editable: boolean;
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

/** Determines a single segment's render state. */
export function segmentState(
  segment: Segment,
  phase: DayPhase,
  activeIndex: number | null,
  isCompleted: boolean,
  statusColoring: boolean,
): SegmentState {
  if (isCompleted) return 'completed';
  if (phase === 'before') return 'future';

  if (phase === 'in' && activeIndex !== null) {
    if (segment.index === activeIndex) return 'active';
    if (segment.index > activeIndex) return 'future';
  }

  // Past (either elapsed within the window, or the whole day has ended).
  return statusColoring ? 'failed' : 'past';
}

/** A segment is editable in the present and future, but never in the past. */
function isEditable(segment: Segment, phase: DayPhase, activeIndex: number | null): boolean {
  if (phase === 'before') return true;
  if (phase === 'after') return false;
  return activeIndex !== null && segment.index >= activeIndex;
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
      editable: isEditable(segment, phase, activeIndex),
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
