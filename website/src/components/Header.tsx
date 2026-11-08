import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';
import { REPO_URL } from '../site';
import Mark from './Mark';

interface HeaderProps {
  path: string;
}

export default function Header(props: HeaderProps): JSX.Element {
  css`
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: color-mix(in srgb, var(--bg) 78%, transparent);
      backdrop-filter: saturate(1.4) blur(14px);
      -webkit-backdrop-filter: saturate(1.4) blur(14px);
      border-bottom: 1px solid var(--line);
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      max-width: var(--page);
      height: 4rem;
      margin: 0 auto;
      padding: 0 var(--gutter);
    }
    .home {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-right: auto;
      font: 700 1rem/1 var(--font-mono);
      letter-spacing: -0.03em;
      text-decoration: none;
    }
    .mark {
      width: 1.625rem;
      height: 1.625rem;
      transition: transform 0.5s var(--ease);
    }
    .home:hover .mark {
      transform: rotate(-8deg) scale(1.06);
    }
    nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    nav a,
    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      height: 2.25rem;
      padding: 0 0.75rem;
      border: 0;
      border-radius: 999px;
      background: none;
      color: var(--text-2);
      font: 500 0.875rem/1 var(--font-mono);
      text-decoration: none;
      cursor: pointer;
      transition:
        color 0.2s,
        background-color 0.2s;
    }
    nav a:hover,
    button:hover {
      color: var(--text);
      background: var(--surface-2);
    }
    nav a[aria-current] {
      color: var(--text);
    }
    button {
      width: 2.25rem;
      padding: 0;
      justify-content: center;
    }
    svg.icon {
      width: 1.125rem;
      height: 1.125rem;
    }
    .sun {
      display: none;
    }
    :global([data-theme='light']) .sun {
      display: block;
    }
    :global([data-theme='light']) .moon {
      display: none;
    }
    @media (prefers-color-scheme: light) {
      :global(:root:not([data-theme='dark'])) .sun {
        display: block;
      }
      :global(:root:not([data-theme='dark'])) .moon {
        display: none;
      }
    }
    @media (max-width: 30rem) {
      .github-label {
        display: none;
      }
    }
  `;

  return (
    <header>
      <div class="bar">
        <a class="home" href="/" aria-label="solid-styled home">
          <Mark id="header-mark" class="mark" use:solid-styled />
          <span>solid-styled</span>
        </a>
        <nav aria-label="Main">
          <a href="/docs/" aria-current={props.path.startsWith('/docs') ? 'page' : undefined}>
            Docs
          </a>
          <a href={REPO_URL}>
            <svg class="icon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span class="github-label">GitHub</span>
          </a>
          <button type="button" data-theme-toggle aria-label="Toggle color theme">
            <svg
              class="icon moon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            >
              <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
            </svg>
            <svg
              class="icon sun"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            >
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}
