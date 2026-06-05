import { create } from 'zustand';
import type { AppConfig, DesignTokens, StructuralConfig } from '@/core/model/types';
import {
  createDefaultConfig,
  MAX_CHECK_SCALE_PCT,
  MAX_FOCUS_SCALE_PCT,
  MAX_FONT_SCALE_PCT,
  MAX_GOAL_LENGTH,
  MAX_MASK_OPACITY_PCT,
  MAX_PROFILE_NAME_LENGTH,
  MAX_SEGMENT_GAP,
  MAX_SEGMENT_GAP_RATIO,
  MAX_TIME_SCALE_PCT,
  MIN_CHECK_SCALE_PCT,
  MIN_FOCUS_SCALE_PCT,
  MIN_FONT_SCALE_PCT,
  MIN_MASK_OPACITY_PCT,
  MIN_SEGMENT_GAP,
  MIN_SEGMENT_GAP_RATIO,
  MIN_TIME_SCALE_PCT,
} from '@/core/model/defaults';
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
  setSegmentGapRatio: (pct: number) => void;
  setCheckScale: (pct: number) => void;
  setFocusGoalScale: (pct: number) => void;
  setFocusMetaScale: (pct: number) => void;
  setFocusCheckScale: (pct: number) => void;
  setMaskOpacity: (pct: number) => void;
  setMotionEasing: (easing: string) => void;
  setProfileName: (name: string) => void;
  setStatusColoring: (on: boolean) => void;
  setGoal: (minuteOfDay: number, text: string) => boolean;
  setCompleted: (minuteOfDay: number, completed: boolean, windowDateKey: string) => void;
  syncWindow: (windowDateKey: string | null) => void;
  replaceConfig: (config: AppConfig) => void;
  resetContent: () => void;
  resetDesign: () => void;
}

function segmentSlotKey(clockHour: number, subIndex: number): string {
  return `${clockHour}:${subIndex}`;
}

function remapToStructure(
  prevStructure: StructuralConfig,
  nextStructure: StructuralConfig,
  goals: Record<number, string>,
  completed: number[],
): { goals: Record<number, string>; completed: number[] } {
  const prevSegments = buildSegments(prevStructure);
  const nextSegments = buildSegments(nextStructure);
  const prevByMinute = new Map(prevSegments.map((segment) => [segment.minuteOfDay, segment] as const));
  const nextMinuteBySlot = new Map(
    nextSegments.map((segment) => [segmentSlotKey(segment.clockHour, segment.subIndex), segment.minuteOfDay] as const),
  );

  const nextGoals: Record<number, string> = {};
  for (const [key, value] of Object.entries(goals)) {
    const oldMinute = Number(key);
    const oldSegment = prevByMinute.get(oldMinute);
    if (!oldSegment) continue;
    const nextMinute = nextMinuteBySlot.get(segmentSlotKey(oldSegment.clockHour, oldSegment.subIndex));
    if (nextMinute === undefined) continue;
    nextGoals[nextMinute] = value;
  }

  const nextCompletedSet = new Set<number>();
  for (const oldMinute of completed) {
    const oldSegment = prevByMinute.get(oldMinute);
    if (!oldSegment) continue;
    const nextMinute = nextMinuteBySlot.get(segmentSlotKey(oldSegment.clockHour, oldSegment.subIndex));
    if (nextMinute === undefined) continue;
    nextCompletedSet.add(nextMinute);
  }

  return { goals: nextGoals, completed: [...nextCompletedSet].sort((a, b) => a - b) };
}

export type ConfigStore = AppConfig & ConfigActions;

export const useConfigStore = create<ConfigStore>((set) => ({
  ...loadInitial(),

  setStructure: (patch) =>
    set((state) => {
      const structure = sanitizeStructurePatch(state.structure, patch);
      const pruned = remapToStructure(
        state.structure,
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

  setFontScale: (pct) =>
    set(() => ({ fontScalePct: clampScale(pct, MIN_FONT_SCALE_PCT, MAX_FONT_SCALE_PCT) })),

  setTimeScale: (pct) =>
    set(() => ({ timeScalePct: clampScale(pct, MIN_TIME_SCALE_PCT, MAX_TIME_SCALE_PCT) })),

  setSegmentGap: (vw) => set(() => ({ segmentGap: Math.min(MAX_SEGMENT_GAP, Math.max(MIN_SEGMENT_GAP, vw)) })),

  setSegmentGapRatio: (pct) =>
    set(() => ({
      segmentGapRatio: clampScale(pct, MIN_SEGMENT_GAP_RATIO, MAX_SEGMENT_GAP_RATIO),
    })),

  setCheckScale: (pct) =>
    set(() => ({ checkScalePct: clampScale(pct, MIN_CHECK_SCALE_PCT, MAX_CHECK_SCALE_PCT) })),

  setFocusGoalScale: (pct) =>
    set(() => ({
      focusGoalScalePct: clampScale(pct, MIN_FOCUS_SCALE_PCT, MAX_FOCUS_SCALE_PCT),
    })),

  setFocusMetaScale: (pct) =>
    set(() => ({
      focusMetaScalePct: clampScale(pct, MIN_FOCUS_SCALE_PCT, MAX_FOCUS_SCALE_PCT),
    })),

  setFocusCheckScale: (pct) =>
    set(() => ({
      focusCheckScalePct: clampScale(pct, MIN_FOCUS_SCALE_PCT, MAX_FOCUS_SCALE_PCT),
    })),

  setMaskOpacity: (pct) =>
    set(() => ({ maskOpacityPct: clampScale(pct, MIN_MASK_OPACITY_PCT, MAX_MASK_OPACITY_PCT) })),

  setMotionEasing: (easing) => set(() => ({ motionEasing: easing })),

  setProfileName: (name) =>
    set(() => ({ profileName: name.trim().slice(0, MAX_PROFILE_NAME_LENGTH) })),

  setStatusColoring: (on) =>
    set((state) => ({ behavior: { ...state.behavior, statusColoring: on } })),

  setGoal: (minuteOfDay, text) => {
    let blocked = false;
    set((state) => {
      const goals = { ...state.routines.default.goals };
      const value = text.trim();
      if (value.length > 0) {
        if (value.length > MAX_GOAL_LENGTH) {
          blocked = true;
          return state;
        }
        goals[minuteOfDay] = value;
      } else {
        delete goals[minuteOfDay];
      }
      return { routines: { ...state.routines, default: { goals } } };
    });
    return !blocked;
  },

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
    set((state) => ({
      tokens: defaults.tokens,
      fontScalePct: defaults.fontScalePct,
      timeScalePct: defaults.timeScalePct,
      segmentGap: defaults.segmentGap,
      segmentGapRatio: defaults.segmentGapRatio,
      checkScalePct: defaults.checkScalePct,
      focusGoalScalePct: defaults.focusGoalScalePct,
      focusMetaScalePct: defaults.focusMetaScalePct,
      focusCheckScalePct: defaults.focusCheckScalePct,
      maskOpacityPct: defaults.maskOpacityPct,
      motionEasing: defaults.motionEasing,
      behavior: defaults.behavior,
      profileName: state.profileName,
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

export function selectConfig(state: ConfigStore): AppConfig {
  return {
    version: state.version,
    structure: state.structure,
    tokens: state.tokens,
    fontScalePct: state.fontScalePct,
    timeScalePct: state.timeScalePct,
    segmentGap: state.segmentGap,
    segmentGapRatio: state.segmentGapRatio,
    checkScalePct: state.checkScalePct,
    focusGoalScalePct: state.focusGoalScalePct,
    focusMetaScalePct: state.focusMetaScalePct,
    focusCheckScalePct: state.focusCheckScalePct,
    maskOpacityPct: state.maskOpacityPct,
    motionEasing: state.motionEasing,
    profileName: state.profileName,
    behavior: state.behavior,
    routines: state.routines,
    completion: state.completion,
  };
}

let lastSerialized = JSON.stringify(selectConfig(useConfigStore.getState()));
useConfigStore.subscribe((state) => {
  const next = JSON.stringify(selectConfig(state));
  if (next !== lastSerialized) {
    lastSerialized = next;
    storage.save(selectConfig(state));
  }
});

export { storage as configStorage };
