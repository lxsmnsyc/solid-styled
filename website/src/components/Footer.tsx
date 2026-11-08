import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';
import { LEGACY_URL, LICENSE_URL, NPM_URL, REPO_URL, TAGLINE } from '../site';
import Mark from './Mark';

export default function Footer(): JSX.Element {
  css`
    footer {
      margin-top: clamp(4rem, 10vw, 8rem);
      border-top: 1px solid var(--line);
      background: var(--surface);
    }
    .inner {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2rem 3rem;
      align-items: end;
      max-width: var(--page);
      margin: 0 auto;
      padding: 3rem var(--gutter) 2.5rem;
    }
    .brand {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.25rem 1rem;
      align-items: center;
    }
    .mark {
      grid-row: span 2;
      width: 2.75rem;
      height: 2.75rem;
    }
    strong {
      font: 700 1.125rem/1.2 var(--font-mono);
      letter-spacing: -0.03em;
    }
    .brand p {
      margin: 0;
      color: var(--text-3);
      font-size: 0.875rem;
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
      font: 500 0.8125rem/1.4 var(--font-mono);
    }
    a {
      color: var(--text-2);
      text-decoration: none;
    }
    a:hover {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }
    .legacy {
      grid-column: 1 / -1;
      margin: 0;
      padding-top: 1.5rem;
      border-top: 1px solid var(--line);
      color: var(--text-3);
      font-size: 0.8125rem;
    }
    .legacy a {
      color: var(--accent);
    }
    @media (max-width: 48rem) {
      .inner {
        grid-template-columns: 1fr;
        align-items: start;
      }
    }
  `;

  return (
    <footer>
      <div class="inner">
        <div class="brand">
          <Mark id="footer-mark" class="mark" use:solid-styled />
          <strong>solid-styled</strong>
          <p>{TAGLINE}</p>
        </div>
        <ul aria-label="Project links">
          <li>
            <a href={REPO_URL}>GitHub</a>
          </li>
          <li>
            <a href={NPM_URL}>npm</a>
          </li>
          <li>
            <a href={`${REPO_URL}/blob/main/packages/solid-styled/CHANGELOG.md`}>Changelog</a>
          </li>
          <li>
            <a href={LICENSE_URL}>MIT License</a>
          </li>
        </ul>
        <p class="legacy">
          On Solid 1.x? Use solid-styled 0.x from the <a href={LEGACY_URL}>0.x branch</a>. It only
          gets fixes.
        </p>
      </div>
    </footer>
  );
}
