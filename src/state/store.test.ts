import { beforeEach, describe, expect, it } from 'vitest';
import { useConfigStore } from './store';
import { createDefaultConfig } from '@/core/model/defaults';

const minuteOf = (hour: number, minute: number) => hour * 60 + minute;

describe('store — structure pruning', () => {
  beforeEach(() => {
    useConfigStore.getState().replaceConfig(createDefaultConfig());
  });

  it('erases goals of removed sub-segments and keeps the rest', () => {
    const store = useConfigStore.getState();
    store.setStructure({ startHour: 7, endHour: 24, segmentsPerHour: 4 });
    store.setGoal(minuteOf(7, 0), 'kept'); // 07:00 — valid at any division
    store.setGoal(minuteOf(7, 45), 'dropped'); // 07:45 — only exists at 4/hour

    // Narrowing to 3/hour removes the 07:45 slot permanently.
    store.setStructure({ segmentsPerHour: 3 });
    let goals = useConfigStore.getState().routines.default.goals;
    expect(goals[minuteOf(7, 0)]).toBe('kept');
    expect(goals[minuteOf(7, 45)]).toBeUndefined();

    // Widening again does NOT bring the dropped goal back.
    useConfigStore.getState().setStructure({ segmentsPerHour: 4 });
    goals = useConfigStore.getState().routines.default.goals;
    expect(goals[minuteOf(7, 45)]).toBeUndefined();
    expect(goals[minuteOf(7, 0)]).toBe('kept');
  });

  it('prunes goals that fall outside a narrowed hour window', () => {
    const store = useConfigStore.getState();
    store.setStructure({ startHour: 7, endHour: 24, segmentsPerHour: 1 });
    store.setGoal(minuteOf(7, 0), 'morning');
    store.setGoal(minuteOf(22, 0), 'evening');

    store.setStructure({ endHour: 12 });
    const goals = useConfigStore.getState().routines.default.goals;
    expect(goals[minuteOf(7, 0)]).toBe('morning');
    expect(goals[minuteOf(22, 0)]).toBeUndefined();
  });

  it('resetContent clears goals and completion but keeps design', () => {
    const store = useConfigStore.getState();
    store.setGoal(minuteOf(9, 0), 'something');
    store.setToken('colorSuccess', '#abcdef');
    store.resetContent();
    const state = useConfigStore.getState();
    expect(Object.keys(state.routines.default.goals)).toHaveLength(0);
    expect(state.tokens.colorSuccess).toBe('#abcdef');
  });

  it('resetDesign restores default design but keeps goals', () => {
    const store = useConfigStore.getState();
    store.setGoal(minuteOf(9, 0), 'keep me');
    store.setToken('colorSuccess', '#abcdef');
    store.setFontScale(70);
    store.resetDesign();
    const state = useConfigStore.getState();
    expect(state.tokens.colorSuccess).toBe(createDefaultConfig().tokens.colorSuccess);
    expect(state.fontScalePct).toBe(createDefaultConfig().fontScalePct);
    expect(state.routines.default.goals[minuteOf(9, 0)]).toBe('keep me');
  });
});
