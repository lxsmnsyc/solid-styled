import type { JSX } from '@solidjs/web';
import { createSignal } from 'solid-js';
import { css } from 'solid-styled';

export default function Button(): JSX.Element {
  const [color, setColor] = createSignal('orchid');

  css`
    button {
      color: ${color()};
      border: 2px solid currentColor;
      padding: 0.5rem 1rem;
    }
  `;

  return (
    <button
      onClick={() => {
        setColor('hotpink');
      }}
    >
      {color()}
    </button>
  );
}
