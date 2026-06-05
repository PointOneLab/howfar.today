import type { CSSProperties } from 'react';

export type MaterialIconName = 'check' | 'undo';

interface MaterialIconProps {
  name: MaterialIconName;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Material Symbols Sharp (48dp) — bundled paths, viewBox 0 -960 960 960. */
const ICONS: Record<MaterialIconName, string> = {
  check: 'M378-246 154-470l43-43 181 181 384-384 43 43-427 427Z',
  undo: 'M259-200v-60h310q70 0 120.5-46.5T740-422q0-69-50.5-115.5T569-584H274l114 114-42 42-186-186 186-186 42 42-114 114h294q95 0 163.5 64T800-422q0 94-68.5 158T568-200H259Z',
};

const VIEW_BOX = '0 -960 960 960';

export function MaterialIcon({ name, className, style, title }: MaterialIconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox={VIEW_BOX}
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
    >
      {title ? <title>{title}</title> : null}
      <path d={ICONS[name]} />
    </svg>
  );
}
