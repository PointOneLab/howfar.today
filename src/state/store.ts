import { create } from 'zustand';
import type { AppConfig, DesignTokens, StructuralConfig } from '@/core/model/types';
import { createDefaultConfig } from '@/core/model/defaults';
import { sanitizeConfig } from '@/core/model/validate';
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
  setStatusColoring: (on: boolean) => void;
  setGoal: (minuteOfDay: number, text: string) => void;
  /** Adds or removes a completion for the active window; clamps to the window date. */
  setCompleted: (minuteOfDay: number, completed: boolean, windowDateKey: string) => void;
  /** Resets daily completion state when a new routine window begins. */
  syncWindow: (windowDateKey: string | null) => void;
  /** Replaces the whole config (CSV import). */
  replaceConfig: (config: AppConfig) => void;
  /** Restores factory defaults. */
  resetConfig: () => void;
}

export type ConfigStore = AppConfig & ConfigActions;

export const useConfigStore = create<ConfigStore>((set) => ({
  ...loadInitial(),

  setStructure: (patch) =>
    set((state) => ({ structure: sanitizeStructurePatch(state.structure, patch) })),

  setToken: (key, value) => set((state) => ({ tokens: { ...state.tokens, [key]: value } })),

  setFontScale: (pct) => set(() => ({ fontScalePct: clampFontScale(pct) })),

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

  resetConfig: () => set(() => ({ ...createDefaultConfig() })),
}));

function clampFontScale(pct: number): number {
  return Math.min(75, Math.max(25, Math.round(pct)));
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
