import type { JSX } from '@solidjs/web';
import { createSignal } from 'solid-js';

export default function Button(): JSX.Element {
  const [color, setColor] = createSignal('orchid');

  return (
    <>
      <style jsx>
        {`
          button {
            color: ${color()};
            border: 2px solid currentColor;
            padding: 0.5rem 1rem;
          }
        `}
      </style>
      <button
        onClick={() => {
          setColor('hotpink');
        }}
      >
        {color()}
      </button>
    </>
  );
}
