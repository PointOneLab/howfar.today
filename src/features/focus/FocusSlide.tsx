import type { DayView } from '@/core/engine/status';
import { formatCountdown } from '@/core/engine/time';
import { activeRemainingSeconds } from '@/services/documentChrome';
import { MaterialIcon } from '@/components/icons/MaterialIcon';

interface FocusSlideProps {
  view: DayView;
  onToggleComplete: (minuteOfDay: number, currentlyCompleted: boolean) => void;
}

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

  const fillWidth = view.activeProgress * 100;
  const fillModifier = active.state === 'completed' ? ' focus__fill--completed' : '';
  const goalText = active.goal.trim();
  const remaining = activeRemainingSeconds(view);

  return (
    <section className="slide focus" aria-label="Focus">
      <div
        className={`focus__fill${fillModifier}`}
        style={{ width: `${fillWidth}%` }}
        aria-hidden="true"
      />
      <div className="slide__mask" aria-hidden="true" />
      <div className="focus__content">
        <div className="focus__meta">
          {remaining !== null ? formatCountdown(remaining) : ''}
        </div>

        <div className={`focus__goal${goalText ? '' : ' focus__goal--empty'}`}>
          {goalText || 'No goal'}
        </div>

        {goalText ? (
          <button
            type="button"
            className={`focus__status${active.isCompleted ? ' focus__status--done' : ''}`}
            onClick={() => onToggleComplete(active.segment.minuteOfDay, active.isCompleted)}
            aria-pressed={active.isCompleted}
            title={active.isCompleted ? 'Revert completion' : 'Mark completed'}
          >
            <MaterialIcon name={active.isCompleted ? 'undo' : 'check'} />
          </button>
        ) : null}
      </div>
    </section>
  );
}
