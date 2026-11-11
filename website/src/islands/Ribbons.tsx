import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';

interface RibbonsProps {
  hue: string;
  tilt: string;
  gap: string;
}

export default function Ribbons(props: RibbonsProps): JSX.Element {
  css`
    div {
      --hue: ${props.hue};
      position: relative;
      aspect-ratio: 1;
      rotate: ${props.tilt}deg;
    }
    span {
      position: absolute;
      inset: 0;
      transition: translate 0.3s ease;
    }
    .top {
      clip-path: polygon(8% 6%, 80% 6%, 94.7% 30%, 22.7% 30%);
      background: linear-gradient(
        90deg,
        hsl(var(--hue) 55% 37%),
        hsl(calc(var(--hue) + 14) 50% 52%)
      );
      translate: 0 calc(${props.gap}px * -1);
    }
    .spine {
      clip-path: polygon(8% 6%, 38% 6%, 92% 94%, 62% 94%);
      background: linear-gradient(
        160deg,
        hsl(calc(var(--hue) + 6) 48% 51%),
        hsl(calc(var(--hue) + 28) 50% 52%)
      );
    }
    .bottom {
      clip-path: polygon(92% 94%, 20% 94%, 5.3% 70%, 77.3% 70%);
      background: linear-gradient(
        270deg,
        hsl(calc(var(--hue) + 28) 50% 52%),
        hsl(calc(var(--hue) + 40) 100% 80%)
      );
      translate: 0 ${props.gap}px;
    }
  `;

  return (
    <div role="img" aria-label="The solid-styled mark, drawn with three CSS variables">
      <span class="top" />
      <span class="spine" />
      <span class="bottom" />
    </div>
  );
}
