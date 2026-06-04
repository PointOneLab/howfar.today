import type { DayView } from '@/core/engine/status';

interface FocusSlideProps {
  view: DayView;
  onToggleComplete: (minuteOfDay: number, currentlyCompleted: boolean) => void;
}

/**
 * Slide 1 — distraction-free execution of the active time slot. The slide's
 * full-bleed background acts as a horizontal progress bar for the running
 * segment; completion only recolors the fill, it does not change its width.
 */
export function FocusSlide({ view, onToggleComplete }: FocusSlideProps) {
  const active = view.active;

  if (!active) {
    const message =
      view.phase === 'before' ? 'Your day has not started yet' : 'Your day is complete';
    return (
      <section className="slide focus" aria-label="Focus">
        <div className="slide__mask" aria-hidden="true" />
        <div className="focus__content">
          <div className="focus__idle">{message}</div>
        </div>
      </section>
    );
  }

  // Completion recolors the fill but the width always reflects real elapsed time.
  const fillWidth = view.activeProgress * 100;
  const fillModifier = active.state === 'completed' ? ' focus__fill--completed' : '';
  const goalText = active.goal.trim();

  return (
    <section className="slide focus" aria-label="Focus">
      <div
        className={`focus__fill${fillModifier}`}
        style={{ width: `${fillWidth}%` }}
        aria-hidden="true"
      />
      <div className="slide__mask" aria-hidden="true" />
      <div className="focus__content">
        <div className="focus__bounds">
          {active.segment.startLabel} — {active.segment.endLabel}
        </div>

        <div className={`focus__goal${goalText ? '' : ' focus__goal--empty'}`}>
          {goalText || 'Focus'}
        </div>

        <button
          type="button"
          className={`focus__status${active.isCompleted ? ' focus__status--done' : ''}`}
          onClick={() => onToggleComplete(active.segment.minuteOfDay, active.isCompleted)}
          aria-pressed={active.isCompleted}
          title={active.isCompleted ? 'Revert completion' : 'Mark completed'}
        >
          {active.isCompleted ? '↶' : '✓'}
        </button>
      </div>
    </section>
  );
}
