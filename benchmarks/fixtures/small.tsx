import { css } from 'solid-styled';
import { createSignal } from 'solid-js';

export default function Counter() {
  const [count, setCount] = createSignal(0);
  const [color, setColor] = createSignal('#1f6feb');

  css`
    button {
      color: ${color()};
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: 1px solid currentColor;

      &:hover {
        background-color: rgb(0 0 0 / 5%);
      }
    }

    .count {
      font-weight: bold;
    }
  `;

  return (
    <div>
      <button onClick={() => setCount((value) => value + 1)}>Increment</button>
      <span class="count">{count()}</span>
      <button onClick={() => setColor('#d1242f')}>Danger</button>
    </div>
  );
}
