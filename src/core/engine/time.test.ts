import { describe, expect, it } from 'vitest';
import {
  durationHours,
  formatClock,
  formatCountdown,
  intervalMinutes,
  locateWindow,
  segmentCount,
} from './time';
import type { StructuralConfig } from '../model/types';

const at = (h: number, m = 0, s = 0): Date => {
  const d = new Date(2026, 5, 4, h, m, s);
  return d;
};

describe('durationHours', () => {
  it('handles a normal same-day window', () => {
    expect(durationHours({ startHour: 7, endHour: 24, segmentsPerHour: 4 })).toBe(17);
  });

  it('treats start === end as a full 24-hour day', () => {
    expect(durationHours({ startHour: 4, endHour: 4, segmentsPerHour: 1 })).toBe(24);
    expect(durationHours({ startHour: 0, endHour: 24, segmentsPerHour: 1 })).toBe(24);
  });

  it('handles cross-midnight windows', () => {
    expect(durationHours({ startHour: 22, endHour: 6, segmentsPerHour: 1 })).toBe(8);
  });
});

describe('intervalMinutes & segmentCount', () => {
  it('divides the hour evenly', () => {
    expect(intervalMinutes({ startHour: 0, endHour: 1, segmentsPerHour: 4 })).toBe(15);
    expect(intervalMinutes({ startHour: 0, endHour: 1, segmentsPerHour: 6 })).toBe(10);
  });

  it('counts every segment in the window', () => {
    expect(segmentCount({ startHour: 7, endHour: 24, segmentsPerHour: 4 })).toBe(68);
  });
});

describe('formatting', () => {
  it('formats clock labels', () => {
    expect(formatClock(435)).toBe('07:15');
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(1440)).toBe('00:00');
  });

  it('formats countdowns', () => {
    expect(formatCountdown(90)).toBe('01:30');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(605)).toBe('10:05');
  });
});

describe('locateWindow — same-day 07:00–24:00', () => {
  const cfg: StructuralConfig = { startHour: 7, endHour: 24, segmentsPerHour: 4 };

  it('is in-window mid-day', () => {
    const pos = locateWindow(cfg, at(12, 0));
    expect(pos.phase).toBe('in');
    expect(pos.offsetMinutes).toBe(300);
  });

  it('is before-window an hour ahead of start', () => {
    expect(locateWindow(cfg, at(6, 0)).phase).toBe('before');
  });

  it('is after-window just past midnight end', () => {
    expect(locateWindow(cfg, at(0, 30)).phase).toBe('after');
  });
});

describe('locateWindow — cross-midnight 22:00–06:00', () => {
  const cfg: StructuralConfig = { startHour: 22, endHour: 6, segmentsPerHour: 1 };

  it('is in-window before midnight', () => {
    const pos = locateWindow(cfg, at(23, 30));
    expect(pos.phase).toBe('in');
    expect(pos.offsetMinutes).toBe(90);
  });

  it('is in-window after midnight (window started yesterday)', () => {
    const pos = locateWindow(cfg, at(2, 0));
    expect(pos.phase).toBe('in');
    expect(pos.offsetMinutes).toBe(240);
    // window start date is the previous calendar day
    expect(pos.windowStartDate?.getDate()).toBe(3);
  });

  it('is after-window shortly past the end', () => {
    expect(locateWindow(cfg, at(6, 30)).phase).toBe('after');
  });

  it('is before-window approaching the next start', () => {
    expect(locateWindow(cfg, at(21, 0)).phase).toBe('before');
  });
});

describe('locateWindow — full 24h window never leaves', () => {
  const cfg: StructuralConfig = { startHour: 4, endHour: 4, segmentsPerHour: 1 };
  it('is always in-window', () => {
    expect(locateWindow(cfg, at(3, 59)).phase).toBe('in');
    expect(locateWindow(cfg, at(4, 0)).phase).toBe('in');
    expect(locateWindow(cfg, at(15, 0)).phase).toBe('in');
  });
});
