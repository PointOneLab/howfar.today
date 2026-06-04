import { useEffect, useMemo, useRef } from 'react';
import type { AppConfig } from '@/core/model/types';
import { buildDayView, type DayView } from '@/core/engine/status';
import { locateWindow, toLocalDateKey } from '@/core/engine/time';
import { DEFAULT_TOKENS } from '@/core/model/defaults';
import { useConfigStore } from '@/state/store';

/**
 * Computes the time-resolved {@link DayView} from current configuration and a
 * supplied `now`. Recomputes each tick; the work is cheap and pure.
 */
export function useDayView(now: Date): DayView {
  const structure = useConfigStore((s) => s.structure);
  const statusColoring = useConfigStore((s) => s.behavior.statusColoring);
  const goals = useConfigStore((s) => s.routines.default.goals);
  const completion = useConfigStore((s) => s.completion);

  return useMemo<DayView>(() => {
    const config: AppConfig = {
      version: 1,
      structure,
      tokens: DEFAULT_TOKENS,
      fontScalePct: 50,
      behavior: { statusColoring },
      routines: { default: { goals } },
      completion,
    };
    return buildDayView(config, now);
  }, [structure, statusColoring, goals, completion, now]);
}

/**
 * Keeps the daily-resetting completion state aligned with the active routine
 * window. When a new window begins (a new local date), completion resets.
 */
export function useWindowSync(now: Date): void {
  const structure = useConfigStore((s) => s.structure);
  const syncWindow = useConfigStore((s) => s.syncWindow);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const position = locateWindow(structure, now);
    const key = position.windowStartDate ? toLocalDateKey(position.windowStartDate) : null;
    if (key !== null && key !== lastKey.current) {
      lastKey.current = key;
      syncWindow(key);
    }
  }, [structure, now, syncWindow]);
}
