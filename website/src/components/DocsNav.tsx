import type { JSX } from '@solidjs/web';
import { For } from 'solid-js';
import { css } from 'solid-styled';
import content from 'virtual:site-content';

interface DocsNavProps {
  current: string;
}

export default function DocsNav(props: DocsNavProps): JSX.Element {
  css`
    nav {
      position: sticky;
      top: 6rem;
      align-self: start;
    }
    a.all {
      display: block;
      margin-bottom: 1rem;
      color: var(--text-3);
      font: 600 0.75rem/1 var(--font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-decoration: none;
    }
    a.all:hover {
      color: var(--text);
    }
    ol {
      display: grid;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: guide;
    }
    li {
      counter-increment: guide;
    }
    li a {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      color: var(--text-2);
      font: 500 0.875rem/1.3 var(--font-mono);
      text-decoration: none;
      white-space: nowrap;
    }
    li a::before {
      content: counter(guide, decimal-leading-zero);
      color: var(--text-3);
      font-size: 0.75rem;
      line-height: 1.75;
    }
    li a:hover {
      background: var(--surface-2);
      color: var(--text);
    }
    li a[aria-current] {
      background: var(--surface-2);
      color: var(--text);
      box-shadow: inset 2px 0 0 var(--accent);
    }
    li a[aria-current]::before {
      color: var(--accent);
    }
    @media (max-width: 52rem) {
      nav {
        position: sticky;
        top: 4rem;
        z-index: 10;
        margin: 0 calc(var(--gutter) * -1) 1rem;
        padding: 0.625rem var(--gutter);
        background: color-mix(in srgb, var(--bg) 88%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--line);
      }
      a.all {
        display: none;
      }
      ol {
        display: flex;
        gap: 0.25rem;
        overflow-x: auto;
        scrollbar-width: none;
      }
    }
  `;

  return (
    <nav aria-label="Guides">
      <a class="all" href="/docs/">
        Guides
      </a>
      <ol>
        <For each={content.docs}>
          {(doc) => (
            <li>
              <a
                href={`/docs/${doc.slug}/`}
                aria-current={doc.slug === props.current ? 'page' : undefined}
              >
                {doc.title}
              </a>
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
}
