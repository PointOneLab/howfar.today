import type { Segment, StructuralConfig } from '../model/types';
import { MINUTES_PER_DAY, durationHours, formatClock, intervalMinutes, pad2 } from './time';

/**
 * Generates the full ordered list of segments for a structural configuration.
 *
 * Rows correspond to hours of the window (in clock order, wrapping past
 * midnight where needed). Each hour is divided into `segmentsPerHour` equal
 * sub-segments. Layout is always left-aligned and time indicators are passive.
 */
export function buildSegments(structure: StructuralConfig): Segment[] {
  const hours = durationHours(structure);
  const interval = intervalMinutes(structure);
  const { segmentsPerHour, startHour } = structure;

  const segments: Segment[] = [];
  let index = 0;

  for (let hourIndex = 0; hourIndex < hours; hourIndex += 1) {
    const clockHour = (startHour + hourIndex) % 24;

    for (let subIndex = 0; subIndex < segmentsPerHour; subIndex += 1) {
      const startMinute = subIndex * interval;
      const minuteOfDay = (clockHour * 60 + startMinute) % MINUTES_PER_DAY;
      const offsetMinutes = index * interval;

      // First sub-segment shows the hour; subsequent ones show their minute.
      const label = subIndex === 0 ? pad2(clockHour) : pad2(startMinute);

      segments.push({
        index,
        hourIndex,
        subIndex,
        clockHour,
        startMinute,
        minuteOfDay,
        offsetMinutes,
        durationMinutes: interval,
        label,
        startLabel: formatClock(minuteOfDay),
        endLabel: formatClock(minuteOfDay + interval),
      });

      index += 1;
    }
  }

  return segments;
}

/** Groups a flat segment list into hour rows for grid rendering. */
export function groupByHour(segments: Segment[]): Segment[][] {
  const rows: Segment[][] = [];
  for (const segment of segments) {
    const row = rows[segment.hourIndex] ?? [];
    row.push(segment);
    rows[segment.hourIndex] = row;
  }
  return rows;
}
