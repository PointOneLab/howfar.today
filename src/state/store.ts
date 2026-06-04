import { create } from 'zustand';
import type { AppConfig, DesignTokens, StructuralConfig } from '@/core/model/types';
import { createDefaultConfig } from '@/core/model/defaults';
import { sanitizeConfig } from '@/core/model/validate';
import { buildSegments } from '@/core/engine/segments';
import { createLocalStorageAdapter } from '@/core/storage/localStorageAdapter';
import type { ConfigStorage } from '@/core/storage/storage';

const storage: ConfigStorage = createLocalStorageAdapter();

function loadInitial(): AppConfig {
  const loaded = storage.load();
  return loaded ?? createDefaultConfig();
}

interface ConfigActions {
  setStructure: (patch: Partial<StructuralConfig>) => void;
  setToken: <K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) => void;
  setFontScale: (pct: number) => void;
  setTimeScale: (pct: number) => void;
  setSegmentGap: (vw: number) => void;
  setStatusColoring: (on: boolean) => void;
  setGoal: (minuteOfDay: number, text: string) => void;
  /** Adds or removes a completion for the active window; clamps to the window date. */
  setCompleted: (minuteOfDay: number, completed: boolean, windowDateKey: string) => void;
  /** Resets daily completion state when a new routine window begins. */
  syncWindow: (windowDateKey: string | null) => void;
  /** Replaces the whole config (CSV import). */
  replaceConfig: (config: AppConfig) => void;
  /** Clears all goals and completion (the planned content), keeps the design. */
  resetContent: () => void;
  /** Restores default structure, tokens, fonts and behavior, keeps the content. */
  resetDesign: () => void;
}

/** Removes goals/completions that no longer map to a segment in the structure. */
function pruneToStructure(
  structure: StructuralConfig,
  goals: Record<number, string>,
  completed: number[],
): { goals: Record<number, string>; completed: number[] } {
  const valid = new Set(buildSegments(structure).map((s) => s.minuteOfDay));
  const nextGoals: Record<number, string> = {};
  for (const [key, value] of Object.entries(goals)) {
    if (valid.has(Number(key))) nextGoals[Number(key)] = value;
  }
  return { goals: nextGoals, completed: completed.filter((m) => valid.has(m)) };
}

export type ConfigStore = AppConfig & ConfigActions;

export const useConfigStore = create<ConfigStore>((set) => ({
  ...loadInitial(),

  setStructure: (patch) =>
    set((state) => {
      const structure = sanitizeStructurePatch(state.structure, patch);
      const pruned = pruneToStructure(
        structure,
        state.routines.default.goals,
        state.completion.completed,
      );
      return {
        structure,
        routines: { ...state.routines, default: { goals: pruned.goals } },
        completion: { ...state.completion, completed: pruned.completed },
      };
    }),

  setToken: (key, value) => set((state) => ({ tokens: { ...state.tokens, [key]: value } })),

  setFontScale: (pct) => set(() => ({ fontScalePct: clampScale(pct, 25, 75) })),

  setTimeScale: (pct) => set(() => ({ timeScalePct: clampScale(pct, 10, 60) })),

  setSegmentGap: (vw) => set(() => ({ segmentGap: Math.min(3, Math.max(0, vw)) })),

  setStatusColoring: (on) =>
    set((state) => ({ behavior: { ...state.behavior, statusColoring: on } })),

  setGoal: (minuteOfDay, text) =>
    set((state) => {
      const goals = { ...state.routines.default.goals };
      const value = text.slice(0, 200);
      if (value.length > 0) {
        goals[minuteOfDay] = value;
      } else {
        delete goals[minuteOfDay];
      }
      return { routines: { ...state.routines, default: { goals } } };
    }),

  setCompleted: (minuteOfDay, completed, windowDateKey) =>
    set((state) => {
      const sameWindow = state.completion.windowDate === windowDateKey;
      const base = sameWindow ? state.completion.completed : [];
      const next = new Set(base);
      if (completed) next.add(minuteOfDay);
      else next.delete(minuteOfDay);
      return {
        completion: { windowDate: windowDateKey, completed: [...next].sort((a, b) => a - b) },
      };
    }),

  syncWindow: (windowDateKey) =>
    set((state) => {
      if (windowDateKey === null) return {};
      if (state.completion.windowDate === windowDateKey) return {};
      return { completion: { windowDate: windowDateKey, completed: [] } };
    }),

  replaceConfig: (config) => set(() => ({ ...sanitizeConfig(config) })),

  resetContent: () =>
    set((state) => ({
      routines: { ...state.routines, default: { goals: {} } },
      completion: { windowDate: '', completed: [] },
    })),

  resetDesign: () => {
    const defaults = createDefaultConfig();
    set(() => ({
      tokens: defaults.tokens,
      fontScalePct: defaults.fontScalePct,
      timeScalePct: defaults.timeScalePct,
      segmentGap: defaults.segmentGap,
      behavior: defaults.behavior,
    }));
  },
}));

function clampScale(pct: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(pct)));
}

function sanitizeStructurePatch(
  current: StructuralConfig,
  patch: Partial<StructuralConfig>,
): StructuralConfig {
  const merged = { ...current, ...patch };
  return {
    startHour: Math.min(23, Math.max(0, Math.round(merged.startHour))),
    endHour: Math.min(24, Math.max(1, Math.round(merged.endHour))),
    segmentsPerHour: Math.min(6, Math.max(1, Math.round(merged.segmentsPerHour))),
  };
}

/** Selects just the persistable {@link AppConfig} slice from the store. */
export function selectConfig(state: ConfigStore): AppConfig {
  return {
    version: state.version,
    structure: state.structure,
    tokens: state.tokens,
    fontScalePct: state.fontScalePct,
    timeScalePct: state.timeScalePct,
    segmentGap: state.segmentGap,
    behavior: state.behavior,
    routines: state.routines,
    completion: state.completion,
  };
}

// Persist every change. The selector keeps us from serializing action identities.
let lastSerialized = JSON.stringify(selectConfig(useConfigStore.getState()));
useConfigStore.subscribe((state) => {
  const next = JSON.stringify(selectConfig(state));
  if (next !== lastSerialized) {
    lastSerialized = next;
    storage.save(selectConfig(state));
  }
});

export { storage as configStorage };
