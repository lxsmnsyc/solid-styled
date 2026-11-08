import type { JSX } from '@solidjs/web';
import { For } from 'solid-js';
import { css } from 'solid-styled';
import content from 'virtual:site-content';
import type { TocEntry } from '../content-types';

/** The level 2 headings of a guide, which read as its contents. */
function listSections(toc: TocEntry[]): TocEntry[] {
  const sections: TocEntry[] = [];
  for (const entry of toc) {
    if (entry.depth === 2) {
      sections.push(entry);
    }
  }
  return sections;
}

export default function DocsIndex(): JSX.Element {
  css`
    .page {
      max-width: var(--page);
      margin: 0 auto;
      padding: clamp(3rem, 8vw, 5rem) var(--gutter) 0;
    }
    h1 {
      margin: 0 0 clamp(2rem, 5vw, 3.5rem);
      font-size: clamp(2.5rem, 7vw, 5rem);
      letter-spacing: -0.06em;
    }
    ol {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
      gap: 1rem;
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: guide;
    }
    li {
      counter-increment: guide;
    }
    a {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
      padding: 1.5rem;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      text-decoration: none;
      transition:
        border-color 0.25s,
        transform 0.35s var(--ease);
    }
    a:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }
    h2 {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin: 0;
      font-size: 1.375rem;
    }
    h2::before {
      content: counter(guide, decimal-leading-zero);
      color: var(--accent);
      font-size: 0.8125rem;
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    ul li {
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      background: var(--surface-2);
      color: var(--text-2);
      font-size: 0.8125rem;
    }
  `;

  return (
    <div class="page">
      <h1>Docs</h1>
      <ol>
        <For each={content.docs}>
          {(doc) => (
            <li>
              <a href={`/docs/${doc.slug}/`}>
                <h2>{doc.title}</h2>
                <ul>
                  <For each={listSections(doc.toc)}>{(entry) => <li>{entry.text}</li>}</For>
                </ul>
              </a>
            </li>
          )}
        </For>
      </ol>
    </div>
  );
}
