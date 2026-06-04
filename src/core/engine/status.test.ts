import { describe, expect, it } from 'vitest';
import { buildDayView } from './status';
import { createDefaultConfig } from '../model/defaults';
import type { AppConfig } from '../model/types';

const baseConfig = (): AppConfig => ({
  ...createDefaultConfig(),
  structure: { startHour: 7, endHour: 24, segmentsPerHour: 4 },
});

const at = (h: number, m = 0): Date => new Date(2026, 5, 4, h, m, 0);

describe('buildDayView', () => {
  it('marks the correct active segment and progress', () => {
    const view = buildDayView(baseConfig(), at(7, 20)); // 5 min into segment 1 (07:15–07:30)
    expect(view.phase).toBe('in');
    expect(view.activeIndex).toBe(1);
    expect(view.active?.segment.startLabel).toBe('07:15');
    expect(view.activeProgress).toBeCloseTo(5 / 15, 5);
  });

  it('keeps every segment editable, including past ones', () => {
    const view = buildDayView(baseConfig(), at(9, 0));
    expect(view.segments.every((s) => s.editable)).toBe(true);
  });

  it('allows completion on active and past segments but not future ones', () => {
    const view = buildDayView(baseConfig(), at(9, 0));
    const activeIndex = view.activeIndex ?? -1;
    expect(view.segments[0].completable).toBe(true); // past
    expect(view.segments[activeIndex].completable).toBe(true); // active
    expect(view.segments[view.segments.length - 1].completable).toBe(false); // future
  });

  it('fails empty past segments when status coloring is on', () => {
    const config = baseConfig();
    config.behavior.statusColoring = true;
    const view = buildDayView(config, at(9, 0));
    expect(view.segments[0].state).toBe('failed');
  });

  it('shows neutral past color when status coloring is off', () => {
    const config = baseConfig();
    config.behavior.statusColoring = false;
    const view = buildDayView(config, at(9, 0));
    expect(view.segments[0].state).toBe('past');
  });

  it('drops success color too when status coloring is off', () => {
    const config = baseConfig();
    config.behavior.statusColoring = false;
    config.completion = { windowDate: '2026-06-04', completed: [420] };
    const view = buildDayView(config, at(9, 0));
    // completed but coloring off → neutral past, not the success state
    expect(view.segments[0].state).toBe('past');
  });

  it('honours completion state', () => {
    const config = baseConfig();
    const firstMinute = 420;
    config.completion = { windowDate: '2026-06-04', completed: [firstMinute] };
    const view = buildDayView(config, at(9, 0));
    expect(view.segments[0].state).toBe('completed');
  });

  it('treats every segment as future before the day starts', () => {
    const view = buildDayView(baseConfig(), at(6, 0));
    expect(view.phase).toBe('before');
    expect(view.active).toBeNull();
    expect(view.segments.every((s) => s.state === 'future')).toBe(true);
    expect(view.segments.every((s) => s.editable)).toBe(true);
  });
});
