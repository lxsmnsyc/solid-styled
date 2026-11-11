import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';

function Labels(): JSX.Element {
  return (
    <>
      <span>scoped</span>
      <span>reactive</span>
      <span>static</span>
    </>
  );
}

export default function Tags(): JSX.Element {
  css`
    div {
      display: flex;
      gap: 0.5rem;
    }
    div > :global(span) {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: var(--gradient-strong);
      color: white;
    }
  `;

  return (
    <div>
      <Labels />
    </div>
  );
}
