import type { AppConfig, Routine } from '../model/types';

/**
 * Resolves the routine that applies to a given moment.
 *
 * MVP always returns the single shared `default` routine. This indirection is
 * the seam for future per-weekday routines (up to seven): the `_now` argument
 * is already threaded through so a weekday lookup can be added here without
 * touching any caller.
 */
export function resolveRoutine(config: AppConfig, _now: Date): Routine {
  return config.routines.default;
}
