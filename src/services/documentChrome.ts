import type { DesignTokens, SegmentState } from '@/core/model/types';
import type { DayView } from '@/core/engine/status';
import { formatCountdown } from '@/core/engine/time';

const BRAND = 'howfar.today';

/** Remaining whole seconds in the active segment, or null when none is active. */
export function activeRemainingSeconds(view: DayView): number | null {
  if (!view.active) return null;
  const total = view.active.segment.durationMinutes * 60;
  return Math.max(0, Math.ceil(total * (1 - view.activeProgress)));
}

/**
 * Builds the live tab title.
 *  - Active with goal:  "Write report | 12:34"
 *  - Active, no goal:   "No goal | 12:34"
 *  - Outside window:    "howfar.today"
 */
export function buildTabTitle(view: DayView): string {
  const remaining = activeRemainingSeconds(view);
  if (remaining === null || !view.active) return BRAND;
  const goal = view.active.goal.trim() || 'No goal';
  return `${goal} | ${formatCountdown(remaining)}`;
}

/** Picks the favicon accent color for a given segment state. */
function stateColor(state: SegmentState | 'none', tokens: DesignTokens): string {
  switch (state) {
    case 'completed':
      return tokens.colorSuccess;
    case 'failed':
      return tokens.colorFailure;
    case 'active':
      return tokens.colorProgress;
    case 'past':
      return tokens.colorProgress;
    default:
      return tokens.colorVoid;
  }
}

/**
 * Renders an inline SVG favicon that reflects the live state: a square that
 * fills left-to-right with the active segment's progress, tinted by status.
 */
export function buildFaviconSvg(view: DayView, tokens: DesignTokens): string {
  const state: SegmentState | 'none' = view.active ? view.active.state : 'none';
  const fillColor = stateColor(state, tokens);
  const progress = view.active ? view.activeProgress : view.phase === 'after' ? 1 : 0;
  const width = Math.round(progress * 100);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">`,
    `<rect width="100" height="100" fill="${tokens.bgApp}"/>`,
    width > 0 ? `<rect width="${width}" height="100" fill="${fillColor}"/>` : '',
    `</svg>`,
  ].join('');
}

/** Encodes an SVG string as a data URL suitable for a favicon href. */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Renders a PNG favicon data URL for browsers that skip dynamic SVG icons. */
export function buildFaviconPngDataUrl(view: DayView, tokens: DesignTokens): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const state: SegmentState | 'none' = view.active ? view.active.state : 'none';
  const fillColor = stateColor(state, tokens);
  const progress = view.active ? view.activeProgress : view.phase === 'after' ? 1 : 0;
  const width = Math.round(progress * canvas.width);

  ctx.fillStyle = tokens.bgApp;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (width > 0) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, width, canvas.height);
  }

  return canvas.toDataURL('image/png');
}

function upsertFaviconLink(id: string, rel: string): HTMLLinkElement {
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = rel;
    document.head.appendChild(link);
  }
  return link;
}

let lastFaviconKey = '';

/** Applies the title and favicon to the document head (favicon throttled when tab hidden). */
export function applyDocumentChrome(view: DayView, tokens: DesignTokens): void {
  document.title = buildTabTitle(view);

  if (document.visibilityState === 'hidden') return;

  const progress = view.active ? view.activeProgress : view.phase === 'after' ? 1 : 0;
  const state = view.active ? view.active.state : 'none';
  const fillColor = stateColor(state, tokens);
  const key = `${state}:${Math.round(progress * 20)}:${tokens.bgApp}:${fillColor}`;
  if (key === lastFaviconKey) return;
  lastFaviconKey = key;

  const svgHref = svgToDataUrl(buildFaviconSvg(view, tokens));
  const svgLink = upsertFaviconLink('dynamic-favicon-svg', 'icon');
  svgLink.type = 'image/svg+xml';
  svgLink.href = svgHref;

  const pngHref = buildFaviconPngDataUrl(view, tokens);
  if (pngHref) {
    const pngLink = upsertFaviconLink('dynamic-favicon-png', 'shortcut icon');
    pngLink.type = 'image/png';
    pngLink.sizes = '64x64';
    pngLink.href = pngHref;
  }
}
