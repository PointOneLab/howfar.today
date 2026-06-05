import type { MotionEasing } from '../model/defaults';

/** Maps linear progress (0–1) through the selected easing curve. */
export function applyEasing(t: number, easing: string): number {
  const x = Math.min(1, Math.max(0, t));
  switch (easing as MotionEasing) {
    case 'ease-in':
      return x * x;
    case 'ease-in-out':
      return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    case 'ease-out':
      return 1 - Math.pow(1 - x, 2);
    case 'linear':
    default:
      return x;
  }
}
