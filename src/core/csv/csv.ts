import type { AppConfig, DesignTokens } from '../model/types';
import { sanitizeConfig } from '../model/validate';
import { formatClock, pad2 } from '../engine/time';
import type { ShareSelection } from '../share/payload';
import { selectionToTags, tagsToLabel } from '../share/payload';

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toRow(cells: string[]): string {
  return cells.map((c) => escapeField(c)).join(',');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const TOKEN_KEYS: (keyof DesignTokens)[] = [
  'bgApp',
  'colorRegular',
  'colorHighlight',
  'colorInteract',
  'colorSecondary',
  'colorSuccess',
  'colorFailure',
  'colorProgress',
  'colorVoid',
  'colorGrid',
  'strokeGrid',
];

const CLOCK_RE = /^(\d{1,2}):(\d{2})$/;

export type CsvSelection = ShareSelection;

export function exportConfigToCsv(config: AppConfig, sel: CsvSelection): string {
  const lines: string[] = [toRow(['section', 'key', 'value'])];
  const tags = selectionToTags(sel);
  lines.push(toRow(['meta', 'exportTags', tagsToLabel(tags)]));
  lines.push(toRow(['meta', 'profileName', config.profileName]));
  lines.push(toRow(['meta', 'exportedAt', new Date().toISOString()]));
  lines.push(toRow(['meta', 'timezone', Intl.DateTimeFormat().resolvedOptions().timeZone]));

  if (sel.structure) {
    lines.push(toRow(['config', 'startHour', String(config.structure.startHour)]));
    lines.push(toRow(['config', 'endHour', String(config.structure.endHour)]));
    lines.push(toRow(['config', 'segmentsPerHour', String(config.structure.segmentsPerHour)]));
  }

  if (sel.design) {
    lines.push(toRow(['config', 'fontScalePct', String(config.fontScalePct)]));
    lines.push(toRow(['config', 'timeScalePct', String(config.timeScalePct)]));
    lines.push(toRow(['config', 'segmentGapRatio', String(config.segmentGapRatio)]));
    lines.push(toRow(['config', 'checkScalePct', String(config.checkScalePct)]));
    lines.push(toRow(['config', 'focusGoalScalePct', String(config.focusGoalScalePct)]));
    lines.push(toRow(['config', 'focusMetaScalePct', String(config.focusMetaScalePct)]));
    lines.push(toRow(['config', 'focusCheckScalePct', String(config.focusCheckScalePct)]));
    lines.push(toRow(['config', 'maskOpacityPct', String(config.maskOpacityPct)]));
    lines.push(toRow(['config', 'motionEasing', config.motionEasing]));
    lines.push(toRow(['config', 'statusColoring', String(config.behavior.statusColoring)]));
    for (const key of TOKEN_KEYS) {
      lines.push(toRow(['token', key, String(config.tokens[key])]));
    }
  }

  if (sel.goals) {
    const entries = Object.entries(config.routines.default.goals)
      .map(([k, v]) => [Number(k), v] as const)
      .sort((a, b) => a[0] - b[0]);
    for (const [minuteOfDay, goal] of entries) {
      lines.push(toRow(['goal', formatClock(minuteOfDay), goal]));
    }
  }

  if (sel.status) {
    lines.push(toRow(['completion', 'windowDate', config.completion.windowDate]));
    for (const minute of config.completion.completed) {
      lines.push(toRow(['completion', formatClock(minute), '1']));
    }
  }

  return lines.join('\r\n') + '\r\n';
}

export interface CsvImportResult {
  config: AppConfig;
  warnings: string[];
  detected: CsvSelection;
}

export function detectCsvSections(rows: string[][]): CsvSelection {
  const detected: CsvSelection = {
    structure: false,
    goals: false,
    status: false,
    design: false,
  };
  for (const row of rows) {
    const section = (row[0] ?? '').trim().toLowerCase();
    if (section === 'config' || section === 'token') detected.design = true;
    if (section === 'goal') detected.goals = true;
    if (section === 'completion') detected.status = true;
    const key = (row[1] ?? '').trim();
    if (section === 'config' && ['starthour', 'endhour', 'segmentsperhour'].includes(key.toLowerCase())) {
      detected.structure = true;
    }
  }
  return detected;
}

export function importConfigFromCsv(
  text: string,
  base: AppConfig,
  importSel: CsvSelection,
): CsvImportResult {
  const warnings: string[] = [];
  const rows = parseCsv(text);
  const detected = detectCsvSections(rows);
  const draft = structuredClone(base);

  for (const row of rows) {
    const [sectionRaw, keyRaw, valueRaw = ''] = row;
    const section = (sectionRaw ?? '').trim().toLowerCase();
    const key = (keyRaw ?? '').trim();
    const value = valueRaw.trim();

    if (section === 'section' && key.toLowerCase() === 'key') continue;

    if (section === 'meta') {
      if (key === 'profileName' && importSel.goals) draft.profileName = value;
      continue;
    }

    if (section === 'config') {
      const isStructure = ['startHour', 'endHour', 'segmentsPerHour'].includes(key);
      if (isStructure && !importSel.structure) continue;
      if (!isStructure && !importSel.design) continue;

      switch (key) {
        case 'startHour':
          draft.structure.startHour = Number(value);
          break;
        case 'endHour':
          draft.structure.endHour = Number(value);
          break;
        case 'segmentsPerHour':
          draft.structure.segmentsPerHour = Number(value);
          break;
        case 'fontScalePct':
          draft.fontScalePct = Number(value);
          break;
        case 'timeScalePct':
          draft.timeScalePct = Number(value);
          break;
        case 'segmentGap':
        case 'segmentGapRatio':
          draft.segmentGapRatio = Number(value);
          break;
        case 'checkScalePct':
          draft.checkScalePct = Number(value);
          break;
        case 'focusGoalScalePct':
          draft.focusGoalScalePct = Number(value);
          break;
        case 'focusMetaScalePct':
          draft.focusMetaScalePct = Number(value);
          break;
        case 'focusCheckScalePct':
          draft.focusCheckScalePct = Number(value);
          break;
        case 'maskOpacityPct':
          draft.maskOpacityPct = Number(value);
          break;
        case 'motionEasing':
          draft.motionEasing = value;
          break;
        case 'statusColoring':
          draft.behavior.statusColoring = /^(true|1|yes|on)$/i.test(value);
          break;
        default:
          warnings.push(`Unknown config key "${key}" ignored.`);
      }
      continue;
    }

    if (section === 'token') {
      if (!importSel.design) continue;
      if ((TOKEN_KEYS as string[]).includes(key)) {
        if (key === 'strokeGrid') draft.tokens.strokeGrid = Number(value);
        else (draft.tokens as unknown as Record<string, string | number>)[key] = value;
      } else {
        warnings.push(`Unknown token "${key}" ignored.`);
      }
      continue;
    }

    if (section === 'goal') {
      if (!importSel.goals) continue;
      const match = CLOCK_RE.exec(key);
      if (!match) {
        warnings.push(`Invalid goal time "${key}" ignored.`);
        continue;
      }
      const hh = Number(match[1]);
      const mm = Number(match[2]);
      if (hh > 23 || mm > 59) {
        warnings.push(`Out-of-range goal time "${key}" ignored.`);
        continue;
      }
      draft.routines.default.goals[hh * 60 + mm] = valueRaw.trim();
      continue;
    }

    if (section === 'completion') {
      if (!importSel.status) continue;
      if (key === 'windowDate') {
        draft.completion.windowDate = value;
        continue;
      }
      const match = CLOCK_RE.exec(key);
      if (match) {
        const hh = Number(match[1]);
        const mm = Number(match[2]);
        const minute = hh * 60 + mm;
        if (!draft.completion.completed.includes(minute)) {
          draft.completion.completed.push(minute);
        }
      }
      continue;
    }

    if (section) warnings.push(`Unknown section "${section}" ignored.`);
  }

  draft.completion.completed.sort((a, b) => a - b);
  return { config: sanitizeConfig(draft), warnings, detected };
}

export function csvFileName(config: AppConfig, sel: CsvSelection, now: Date = new Date()): string {
  const tags = tagsToLabel(selectionToTags(sel));
  const profile = config.profileName.trim() || 'default';
  const safeProfile = profile.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 24);
  const date = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  return `howfar-${safeProfile}-${date}-${tags}.csv`;
}
