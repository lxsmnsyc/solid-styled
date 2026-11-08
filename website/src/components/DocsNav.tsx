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
      align-items: baseline;
      gap: 0.875rem;
      padding: 0.5rem 0;
      color: var(--text-3);
      font: 500 0.875rem/1.3 var(--font-mono);
      text-decoration: none;
      white-space: nowrap;
      transition: color 0.2s var(--ease);
    }
    /* The number is a small ribbon: skewed like the strokes of the S mark. */
    li a::before {
      content: counter(guide, decimal-leading-zero);
      display: inline-block;
      min-width: 2.25em;
      padding: 0.125em 0.375em;
      transform: skewX(-14deg);
      color: var(--text-3);
      font-size: 0.6875rem;
      font-weight: 700;
      text-align: center;
      transition:
        background-color 0.2s var(--ease),
        color 0.2s var(--ease);
    }
    li a:hover {
      color: var(--text);
    }
    li a:hover::before {
      color: var(--text-2);
    }
    li a[aria-current] {
      color: var(--text);
      font-weight: 700;
    }
    li a[aria-current]::before {
      background: var(--gradient-strong);
      color: #fff;
    }
    @media (prefers-reduced-motion: reduce) {
      li a,
      li a::before {
        transition: none;
      }
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
