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
  const goalText = active.goal.trim();
  const goalStatusClass = goalText
    ? active.state === 'completed'
      ? ' focus__goal--completed'
      : active.state === 'failed'
        ? ' focus__goal--failed'
        : ''
    : '';
  const remaining = activeRemainingSeconds(view);

  return (
    <section className="slide focus" aria-label="Focus">
      <div className="focus__fill" style={{ width: `${fillWidth}%` }} aria-hidden="true" />
      <div className="slide__mask" aria-hidden="true" />
      <div className="focus__content">
        <div className="focus__meta">
          {remaining !== null ? formatCountdown(remaining) : ''}
        </div>

        <div className={`focus__goal${goalText ? '' : ' focus__goal--empty'}${goalStatusClass}`}>
          {goalText || 'Set a goal, and complete the goal.'}
        </div>

        <button
          type="button"
          className={`focus__status${goalText ? '' : ' focus__status--hidden'}`}
          onClick={() => onToggleComplete(active.segment.minuteOfDay, active.isCompleted)}
          aria-pressed={active.isCompleted}
          title={active.isCompleted ? 'Revert completion' : 'Mark completed'}
          disabled={!goalText}
          aria-hidden={!goalText}
          tabIndex={goalText ? 0 : -1}
        >
          <MaterialIcon name={active.isCompleted ? 'undo' : 'check'} />
        </button>
      </div>
    </section>
  );
}
