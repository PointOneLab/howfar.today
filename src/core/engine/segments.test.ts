import { describe, expect, it } from 'vitest';
import { buildSegments, groupByHour } from './segments';

describe('buildSegments', () => {
  it('builds the right count and labels for 07:00–24:00 @ 4/hour', () => {
    const segments = buildSegments({ startHour: 7, endHour: 24, segmentsPerHour: 4 });
    expect(segments).toHaveLength(68);

    const first = segments[0];
    expect(first.label).toBe('07');
    expect(first.startLabel).toBe('07:00');
    expect(first.endLabel).toBe('07:15');
    expect(first.minuteOfDay).toBe(420);

    expect(segments[1].label).toBe('15');
    expect(segments[1].startLabel).toBe('07:15');

    const last = segments[segments.length - 1];
    expect(last.startLabel).toBe('23:45');
    expect(last.endLabel).toBe('00:00');
  });

  it('wraps minute-of-day across midnight', () => {
    const segments = buildSegments({ startHour: 22, endHour: 6, segmentsPerHour: 2 });
    expect(segments[0].minuteOfDay).toBe(22 * 60);
    // 00:00 segment exists with minuteOfDay 0
    const midnight = segments.find((s) => s.startLabel === '00:00');
    expect(midnight?.minuteOfDay).toBe(0);
  });

  it('groups segments into hour rows', () => {
    const rows = groupByHour(buildSegments({ startHour: 9, endHour: 12, segmentsPerHour: 3 }));
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveLength(3);
  });
});
