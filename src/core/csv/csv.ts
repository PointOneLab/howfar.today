import type { AppConfig, DesignTokens } from '../model/types';
import { sanitizeConfig } from '../model/validate';
import { createDefaultConfig } from '../model/defaults';
import { formatClock, pad2 } from '../engine/time';

/** Escapes a single CSV field per RFC 4180 (quotes when needed). */
function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toRow(cells: string[]): string {
  return cells.map((c) => escapeField(c)).join(',');
}

/** Minimal RFC-4180 line splitter that respects quoted fields. */
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

/**
 * Serializes all system parameters, design tokens, and daily goals into a flat,
 * spreadsheet-friendly CSV. Goals are keyed by their "HH:MM" start label so the
 * agenda is easy to edit in Google Sheets or Excel and re-import.
 */
export function exportConfigToCsv(config: AppConfig): string {
  const lines: string[] = [toRow(['section', 'key', 'value'])];

  lines.push(toRow(['config', 'startHour', String(config.structure.startHour)]));
  lines.push(toRow(['config', 'endHour', String(config.structure.endHour)]));
  lines.push(toRow(['config', 'segmentsPerHour', String(config.structure.segmentsPerHour)]));
  lines.push(toRow(['config', 'fontScalePct', String(config.fontScalePct)]));
  lines.push(toRow(['config', 'statusColoring', String(config.behavior.statusColoring)]));

  for (const key of TOKEN_KEYS) {
    lines.push(toRow(['token', key, String(config.tokens[key])]));
  }

  const entries = Object.entries(config.routines.default.goals)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => a[0] - b[0]);
  for (const [minuteOfDay, goal] of entries) {
    lines.push(toRow(['goal', formatClock(minuteOfDay), goal]));
  }

  return lines.join('\r\n') + '\r\n';
}

/** Result of a CSV import attempt. */
export interface CsvImportResult {
  config: AppConfig;
  warnings: string[];
}

const CLOCK_RE = /^(\d{1,2}):(\d{2})$/;

/**
 * Parses a CSV produced by {@link exportConfigToCsv} (or hand-edited to the
 * same shape) into a validated configuration. Existing goals are preserved as a
 * base; the import overlays its values. All values pass through
 * {@link sanitizeConfig} so malformed input can never break the application.
 */
export function importConfigFromCsv(text: string, base?: AppConfig): CsvImportResult {
  const warnings: string[] = [];
  const rows = parseCsv(text);
  const draft = structuredClone(base ?? createDefaultConfig());

  for (const row of rows) {
    const [sectionRaw, keyRaw, valueRaw = ''] = row;
    const section = (sectionRaw ?? '').trim().toLowerCase();
    const key = (keyRaw ?? '').trim();
    const value = valueRaw.trim();

    if (section === 'section' && key.toLowerCase() === 'key') continue; // header

    switch (section) {
      case 'config': {
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
          case 'statusColoring':
            draft.behavior.statusColoring = /^(true|1|yes|on)$/i.test(value);
            break;
          default:
            warnings.push(`Unknown config key "${key}" ignored.`);
        }
        break;
      }
      case 'token': {
        if ((TOKEN_KEYS as string[]).includes(key)) {
          if (key === 'strokeGrid') {
            draft.tokens.strokeGrid = Number(value);
          } else {
            (draft.tokens as unknown as Record<string, string | number>)[key] = value;
          }
        } else {
          warnings.push(`Unknown token "${key}" ignored.`);
        }
        break;
      }
      case 'goal': {
        const match = CLOCK_RE.exec(key);
        if (!match) {
          warnings.push(`Invalid goal time "${key}" ignored.`);
          break;
        }
        const hh = Number(match[1]);
        const mm = Number(match[2]);
        if (hh > 23 || mm > 59) {
          warnings.push(`Out-of-range goal time "${key}" ignored.`);
          break;
        }
        draft.routines.default.goals[hh * 60 + mm] = valueRaw;
        break;
      }
      default:
        if (section) warnings.push(`Unknown section "${section}" ignored.`);
    }
  }

  return { config: sanitizeConfig(draft), warnings };
}

/** Suggests a date-stamped filename for an exported agenda. */
export function csvFileName(now: Date = new Date()): string {
  return `howfar-today-${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}.csv`;
}
