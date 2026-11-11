import type { JSX } from '@solidjs/web';
import { For } from 'solid-js';
import { css } from 'solid-styled';
import content from 'virtual:site-content';
import DocsNav from '../components/DocsNav';
import { REPO_URL } from '../site';

interface DocPageProps {
  index: number;
}

export default function DocPage(props: DocPageProps): JSX.Element {
  const doc = content.docs[props.index];
  const previous = props.index > 0 ? content.docs.at(props.index - 1) : undefined;
  const next = content.docs.at(props.index + 1);

  css`
    .layout {
      display: grid;
      grid-template-columns: 13rem minmax(0, 1fr) 13rem;
      gap: clamp(2rem, 4vw, 4rem);
      max-width: var(--page);
      margin: 0 auto;
      padding: 3rem var(--gutter) 0;
    }
    article {
      min-width: 0;
      max-width: 46rem;
    }
    h1 {
      margin: 0 0 2rem;
      font-size: clamp(2.25rem, 5vw, 3.5rem);
      letter-spacing: -0.05em;
    }
    .toc {
      position: sticky;
      top: 6rem;
      align-self: start;
      max-height: calc(100vh - 8rem);
      overflow: auto;
    }
    .toc p {
      margin: 0 0 0.75rem;
      color: var(--text-3);
      font: 600 0.75rem/1 var(--font-mono);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .toc ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .toc a {
      display: grid;
      grid-template-columns: 0.875rem 1fr;
      align-items: baseline;
      padding: 0.3125rem 0;
      color: var(--text-3);
      font-size: 0.8125rem;
      line-height: 1.4;
      text-decoration: none;
      transition: color 0.2s var(--ease);
    }
    .toc .depth-3 a {
      padding-left: 0.875rem;
    }
    /* A sliver of ribbon marks the section in view. */
    .toc a::before {
      content: '';
      width: 0.3125rem;
      height: 0.75rem;
      transform: skewX(-20deg) scaleY(0);
      background: var(--gradient-strong);
      transition: transform 0.25s var(--ease);
    }
    .toc a:hover {
      color: var(--text);
    }
    .toc a[aria-current] {
      color: var(--text);
    }
    .toc a[aria-current]::before {
      transform: skewX(-20deg) scaleY(1);
    }
    @media (prefers-reduced-motion: reduce) {
      .toc a,
      .toc a::before {
        transition: none;
      }
    }
    .pager {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--line);
    }
    .pager a {
      display: grid;
      gap: 0.25rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: border-color 0.2s;
    }
    .pager a:hover {
      border-color: var(--accent);
    }
    .pager small {
      color: var(--text-3);
      font: 500 0.75rem/1.2 var(--font-mono);
    }
    .pager span {
      font: 600 1rem/1.3 var(--font-mono);
    }
    .pager .next {
      grid-column: 2;
      text-align: right;
    }
    .edit {
      display: inline-block;
      margin-top: 2rem;
      color: var(--text-3);
      font: 500 0.8125rem/1 var(--font-mono);
    }
    .edit:hover {
      color: var(--accent);
    }

    /* The guide body is HTML from markdown, so its elements are reached
       through :global under the scoped .prose. */
    .prose {
      color: var(--text-2);
      font-size: 1.0625rem;
      line-height: 1.75;
    }
    .prose :global(h2) {
      margin: 3.5rem 0 1rem;
      color: var(--text);
      font-size: 1.625rem;
    }
    .prose :global(h2:first-child) {
      margin-top: 0;
    }
    .prose :global(h3) {
      margin: 2.5rem 0 0.75rem;
      color: var(--text);
      font-size: 1.1875rem;
    }
    .prose :global(.anchor) {
      color: inherit;
      text-decoration: none;
    }
    .prose :global(.anchor)::after {
      content: '#';
      margin-left: 0.5rem;
      color: var(--accent);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .prose :global(.anchor:is(:hover, :focus-visible))::after {
      opacity: 1;
    }
    .prose :global(:is(p, ul, ol)) {
      margin: 0 0 1.25rem;
    }
    .prose :global(:is(ul, ol)) {
      padding-left: 1.25rem;
    }
    .prose :global(li) {
      margin: 0.375rem 0;
      padding-left: 0.25rem;
    }
    .prose :global(li)::marker {
      color: var(--accent);
    }
    .prose :global(strong) {
      color: var(--text);
    }
    .prose :global(a:not(.anchor)) {
      color: var(--accent);
      text-decoration-thickness: 1px;
      text-underline-offset: 0.2em;
    }
    .prose :global(a:not(.anchor):hover) {
      text-decoration-thickness: 2px;
    }
    .prose :global(:not(pre) > code) {
      padding: 0.125em 0.375em;
      border-radius: 5px;
      background: var(--surface-2);
      color: var(--text);
      font-size: 0.85em;
      overflow-wrap: anywhere;
    }
    .prose :global(pre) {
      margin: 0 0 1.5rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
    }
    .prose :global([data-code]) {
      position: relative;
    }
    .prose :global(.table) {
      margin: 0 0 1.5rem;
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
    }
    .prose :global(table) {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      line-height: 1.55;
    }
    .prose :global(:is(th, td)) {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }
    .prose :global(th) {
      background: var(--surface);
      color: var(--text);
      font: 600 0.8125rem/1.4 var(--font-mono);
    }
    .prose :global(tr:last-child td) {
      border-bottom: 0;
    }
    /* Names and types stay whole. Long values such as default globs wrap, so
       every column stays in view. */
    .prose :global(td code) {
      overflow-wrap: anywhere;
    }
    .prose :global(:is(th, td):is(:first-child, :nth-child(2))) {
      width: 1%;
      white-space: nowrap;
    }

    @media (max-width: 72rem) {
      .layout {
        grid-template-columns: 12rem minmax(0, 1fr);
      }
      .toc {
        display: none;
      }
    }
    @media (max-width: 52rem) {
      .layout {
        grid-template-columns: minmax(0, 1fr);
        padding-top: 0;
      }
      .pager {
        grid-template-columns: minmax(0, 1fr);
      }
      .pager .next {
        grid-column: 1;
      }
    }
  `;

  return (
    <div class="layout">
      <DocsNav current={doc.slug} />
      <article>
        <h1>{doc.title}</h1>
        <div class="prose" data-prose innerHTML={doc.html} />
        <a class="edit" href={`${REPO_URL}/blob/main/docs/${doc.slug}.md`}>
          Edit this page on GitHub
        </a>
        <nav class="pager" aria-label="Guides">
          {previous ? (
            <a href={`/docs/${previous.slug}/`} rel="prev">
              <small>Previous</small>
              <span>{previous.title}</span>
            </a>
          ) : null}
          {next ? (
            <a class="next" href={`/docs/${next.slug}/`} rel="next">
              <small>Next</small>
              <span>{next.title}</span>
            </a>
          ) : null}
        </nav>
      </article>
      <nav class="toc" aria-labelledby="toc-title" data-toc>
        <p id="toc-title">On this page</p>
        <ul>
          <For each={doc.toc}>
            {(entry) => (
              <li class={`depth-${entry.depth}`}>
                <a href={`#${entry.id}`}>{entry.text}</a>
              </li>
            )}
          </For>
        </ul>
      </nav>
    </div>
  );
}
