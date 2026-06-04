import type { DayView } from '@/core/engine/status';

interface FocusSlideProps {
  view: DayView;
  onToggleComplete: () => void;
}

/**
 * Slide 1 — distraction-free execution of the active time slot. The slide's
 * full-bleed background acts as a horizontal progress bar for the running
 * segment; status coloring reflects completion.
 */
export function FocusSlide({ view, onToggleComplete }: FocusSlideProps) {
  const active = view.active;

  if (!active) {
    const message =
      view.phase === 'before' ? 'Your day has not started yet' : 'Your day is complete';
    return (
      <section className="slide focus" aria-label="Focus">
        <div className="focus__content">
          <div className="focus__idle">{message}</div>
        </div>
        <span className="scroll-hint" aria-hidden="true">
          ▾ scroll for your day
        </span>
      </section>
    );
  }

  const fillWidth = active.isCompleted ? 100 : view.activeProgress * 100;
  const fillModifier = active.isCompleted ? ' focus__fill--completed' : '';
  const goalText = active.goal.trim();

  return (
    <section className="slide focus" aria-label="Focus">
      <div
        className={`focus__fill${fillModifier}`}
        style={{ width: `${fillWidth}%` }}
        aria-hidden="true"
      />
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
          onClick={onToggleComplete}
          aria-pressed={active.isCompleted}
          title={active.isCompleted ? 'Revert completion' : 'Mark completed'}
        >
          {active.isCompleted ? '↶' : '✓'}
        </button>
      </div>
    </section>
  );
}
