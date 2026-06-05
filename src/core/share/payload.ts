import type {
  AppConfig,
  CompletionState,
  DesignTokens,
  Routine,
  StructuralConfig,
} from '../model/types';

/** One-word tags used in export filenames and share metadata. */
export const SHARE_TAGS = {
  structure: 'struct',
  goals: 'goals',
  status: 'status',
  design: 'design',
} as const;

export type ShareTag = (typeof SHARE_TAGS)[keyof typeof SHARE_TAGS];

export interface ShareSelection {
  structure: boolean;
  goals: boolean;
  status: boolean;
  design: boolean;
}

export interface SharePayloadMeta {
  profileName: string;
  sharedAt: string;
  timezone: string;
}

/** Compact wire format for URL hash payloads (v1). */
export interface SharePayloadV1 {
  v: 1;
  meta?: SharePayloadMeta;
  structure?: StructuralConfig;
  goals?: Routine['goals'];
  completion?: CompletionState;
  design?: {
    tokens: DesignTokens;
    fontScalePct: number;
    timeScalePct: number;
    segmentGap: number;
    segmentGapRatio: number;
    checkScalePct: number;
    focusGoalScalePct: number;
    focusMetaScalePct: number;
    focusCheckScalePct: number;
    maskOpacityPct: number;
    motionEasing: string;
    behavior: AppConfig['behavior'];
  };
}

export function selectionToTags(sel: ShareSelection): ShareTag[] {
  const tags: ShareTag[] = [];
  if (sel.structure) tags.push(SHARE_TAGS.structure);
  if (sel.goals) tags.push(SHARE_TAGS.goals);
  if (sel.status) tags.push(SHARE_TAGS.status);
  if (sel.design) tags.push(SHARE_TAGS.design);
  return tags;
}

export function tagsToLabel(tags: ShareTag[]): string {
  return tags.length > 0 ? tags.join('-') : 'empty';
}

/** Builds a partial payload from full config and checkbox selection. */
export function buildSharePayload(
  config: AppConfig,
  sel: ShareSelection,
  meta?: SharePayloadMeta,
): SharePayloadV1 {
  const payload: SharePayloadV1 = { v: 1 };
  if (meta) payload.meta = meta;
  if (sel.structure) payload.structure = { ...config.structure };
  if (sel.goals) payload.goals = { ...config.routines.default.goals };
  if (sel.status) payload.completion = { ...config.completion };
  if (sel.design) {
    payload.design = {
      tokens: { ...config.tokens },
      fontScalePct: config.fontScalePct,
      timeScalePct: config.timeScalePct,
      segmentGap: config.segmentGap,
      segmentGapRatio: config.segmentGapRatio,
      checkScalePct: config.checkScalePct,
      focusGoalScalePct: config.focusGoalScalePct,
      focusMetaScalePct: config.focusMetaScalePct,
      focusCheckScalePct: config.focusCheckScalePct,
      maskOpacityPct: config.maskOpacityPct,
      motionEasing: config.motionEasing,
      behavior: { ...config.behavior },
    };
  }
  return payload;
}

/** Merges a decoded payload into an existing config (only present fields). */
export function mergeSharePayload(base: AppConfig, payload: SharePayloadV1): AppConfig {
  const next = { ...base, structure: { ...base.structure }, tokens: { ...base.tokens } };
  if (payload.meta?.profileName) next.profileName = payload.meta.profileName.trim().slice(0, 40);
  if (payload.structure) next.structure = payload.structure;
  if (payload.goals) next.routines = { default: { goals: payload.goals } };
  if (payload.completion) next.completion = payload.completion;
  if (payload.design) {
    next.tokens = payload.design.tokens;
    next.fontScalePct = payload.design.fontScalePct;
    next.timeScalePct = payload.design.timeScalePct;
    next.segmentGap = payload.design.segmentGap;
    next.segmentGapRatio = payload.design.segmentGapRatio ?? next.segmentGapRatio;
    next.checkScalePct = payload.design.checkScalePct ?? next.checkScalePct;
    next.focusGoalScalePct = payload.design.focusGoalScalePct ?? next.focusGoalScalePct;
    next.focusMetaScalePct = payload.design.focusMetaScalePct ?? next.focusMetaScalePct;
    next.focusCheckScalePct = payload.design.focusCheckScalePct ?? next.focusCheckScalePct;
    next.maskOpacityPct = payload.design.maskOpacityPct ?? next.maskOpacityPct;
    next.motionEasing = payload.design.motionEasing ?? next.motionEasing;
    next.behavior = payload.design.behavior;
  }
  return next;
}

export function payloadHasData(payload: SharePayloadV1): boolean {
  return Boolean(
    payload.structure ||
      payload.goals ||
      payload.completion ||
      payload.design ||
      (payload.goals && Object.keys(payload.goals).length > 0),
  );
}

export function hashHasSharePayload(hash: string): boolean {
  return hash.startsWith('#d=') || hash.startsWith('#v1.');
}
