import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';
import Mark from '../components/Mark';

export default function NotFound(): JSX.Element {
  css`
    .page {
      display: grid;
      justify-items: start;
      gap: 1.5rem;
      max-width: var(--page);
      margin: 0 auto;
      padding: clamp(4rem, 12vw, 8rem) var(--gutter) 0;
    }
    .mark {
      width: 5rem;
      height: 5rem;
      rotate: 180deg;
      opacity: 0.85;
    }
    h1 {
      margin: 0;
      font-size: clamp(2.5rem, 7vw, 5rem);
      letter-spacing: -0.06em;
    }
    p {
      margin: 0;
      color: var(--text-2);
      font-size: 1.125rem;
    }
    a {
      color: var(--accent);
      font-family: var(--font-mono);
    }
  `;

  return (
    <div class="page">
      <Mark id="lost-mark" class="mark" use:solid-styled />
      <h1>404</h1>
      <p>No page at this address.</p>
      <p>
        <a href="/">Home</a> · <a href="/docs/">Docs</a>
      </p>
    </div>
  );
}
