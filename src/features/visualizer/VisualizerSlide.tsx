import { useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { DayView, SegmentView } from '@/core/engine/status';
import { groupByHour } from '@/core/engine/segments';
import { useConfigStore } from '@/state/store';

interface VisualizerSlideProps {
  view: DayView;
  onToggleComplete: (minuteOfDay: number, currentlyCompleted: boolean) => void;
}

/**
 * Slide 2 — the day visualizer. Hour rows divide the viewport equally; each row
 * holds the configured number of sub-segments. Goals are editable inline in any
 * state, with a dedicated keyboard layer (Enter / Shift+Enter / Escape).
 */
export function VisualizerSlide({ view, onToggleComplete }: VisualizerSlideProps) {
  const setGoal = useConfigStore((s) => s.setGoal);
  const inputs = useRef<Map<number, HTMLInputElement>>(new Map());

  const rows = useMemo(() => groupByHour(view.segments.map((s) => s.segment)), [view.segments]);
  const viewByIndex = useMemo(() => {
    const map = new Map<number, SegmentView>();
    view.segments.forEach((s) => map.set(s.segment.index, s));
    return map;
  }, [view.segments]);
  const editableIndices = useMemo(
    () => view.segments.filter((s) => s.editable).map((s) => s.segment.index),
    [view.segments],
  );

  const focusByIndex = (index: number) => {
    const el = inputs.current.get(index);
    if (el) {
      el.focus();
      el.select();
    }
  };

  const moveFocus = (fromIndex: number, direction: 1 | -1) => {
    const pos = editableIndices.indexOf(fromIndex);
    if (pos === -1) return;
    const next = editableIndices[pos + direction];
    if (next !== undefined) focusByIndex(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      moveFocus(index, event.shiftKey ? -1 : 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const style = { '--rows': rows.length || 1 } as CSSProperties;

  return (
    <section className="slide visualizer" aria-label="Day visualizer" style={style}>
      <div className="slide__mask" aria-hidden="true" />
      {rows.map((row, hourIndex) => (
        <div className="hour-row" key={hourIndex}>
          {row.map((segment) => {
            const sv = viewByIndex.get(segment.index);
            if (!sv) return null;
            const fillWidth = sv.isActive
              ? view.activeProgress * 100
              : sv.state === 'future'
                ? 0
                : 100;

            return (
              <div className={`segment segment--${sv.state}`} key={segment.index}>
                <div
                  className="segment__fill"
                  style={{ width: `${fillWidth}%` }}
                  aria-hidden="true"
                />
                <div className="segment__body">
                  <span className="segment__time">{segment.label}</span>
                  <input
                    className="segment__input"
                    type="text"
                    value={sv.goal}
                    placeholder="goal…"
                    maxLength={200}
                    aria-label={`Goal for ${segment.startLabel}`}
                    ref={(el) => {
                      if (el) inputs.current.set(segment.index, el);
                      else inputs.current.delete(segment.index);
                    }}
                    onChange={(e) => setGoal(segment.minuteOfDay, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, segment.index)}
                  />
                  {sv.completable && (
                    <button
                      type="button"
                      className="segment__check"
                      onClick={() => onToggleComplete(segment.minuteOfDay, sv.isCompleted)}
                      aria-pressed={sv.isCompleted}
                      title={sv.isCompleted ? 'Revert completion' : 'Mark completed'}
                    >
                      {sv.isCompleted ? '↶' : '✓'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
