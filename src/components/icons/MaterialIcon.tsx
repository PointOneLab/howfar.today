import type { CSSProperties } from 'react';

export type MaterialIconName = 'check' | 'undo';

interface MaterialIconProps {
  name: MaterialIconName;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Material Symbols Sharp paths, bundled at build time (no runtime CDN). */
const PATHS: Record<MaterialIconName, string> = {
  check:
    'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  undo: 'M12.5 8c-2.65 0-5.05 1.54-6.17 3.95L3.5 10.5V16h5.5l-2.07-2.07c.78-1.27 2.16-2.18 3.77-2.18 2.48 0 4.5 2.02 4.5 4.5s-2.02 4.5-4.5 4.5c-1.56 0-2.94-.8-3.75-2.03l-1.45 1.09C8.98 18.98 10.68 20 12.5 20c3.59 0 6.5-2.91 6.5-6.5S16.09 8 12.5 8z',
};

export function MaterialIcon({ name, className, style, title }: MaterialIconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
