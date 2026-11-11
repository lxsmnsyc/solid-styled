import type { JSX } from '@solidjs/web';
import { omit } from 'solid-js';

interface MarkProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
  /** Prefix for the gradient ids, unique per mark on a page. */
  id: string;
}

// The S: a top band, a diagonal spine and a bottom band, point-symmetric
// around the center of a 100 by 100 box. Band ends follow the spine's slope.
export const TOP = '8,6 80,6 94.7,30 22.7,30';
export const SPINE = '8,6 38,6 92,94 62,94';
export const BOTTOM = '92,94 20,94 5.3,70 77.3,70';

/**
 * The solid-styled mark. Extra props land on the `<svg>`, so a parent can
 * forward its scope with `use:solid-styled`.
 */
export default function Mark(props: MarkProps): JSX.Element {
  const rest = omit(props, 'id');
  const top = `${props.id}-top`;
  const spine = `${props.id}-spine`;
  const bottom = `${props.id}-bottom`;
  const shadow = `${props.id}-shadow`;

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...rest}>
      <defs>
        <linearGradient id={top} x1="8" y1="18" x2="95" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#6b2a92" />
          <stop offset="0.6" stop-color="#8a44c0" />
          <stop offset="1" stop-color="#b24bc4" />
        </linearGradient>
        <linearGradient id={spine} x1="23" y1="6" x2="77" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#8a44c0" />
          <stop offset="0.5" stop-color="#b24bc4" />
          <stop offset="1" stop-color="#c04ab8" />
        </linearGradient>
        <linearGradient id={bottom} x1="92" y1="82" x2="5" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#c04ab8" />
          <stop offset="0.45" stop-color="#f58ae6" />
          <stop offset="1" stop-color="#ff9ad5" />
        </linearGradient>
        <filter id={shadow} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.4"
            flood-color="#2a0f3d"
            flood-opacity="0.55"
          />
        </filter>
      </defs>
      <g class="ribbon ribbon-top">
        <polygon points={TOP} fill={`url(#${top})`} />
      </g>
      <g class="ribbon ribbon-spine">
        <polygon points={SPINE} fill={`url(#${spine})`} filter={`url(#${shadow})`} />
      </g>
      <g class="ribbon ribbon-bottom">
        <polygon points={BOTTOM} fill={`url(#${bottom})`} filter={`url(#${shadow})`} />
      </g>
    </svg>
  );
}
