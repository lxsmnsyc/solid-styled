import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';

interface SectionProps {
  id: string;
  index: string;
  title: string;
  lead: JSX.Element;
  children: JSX.Element;
}

/** A numbered landing page section with its heading and lead paragraph. */
export default function Section(props: SectionProps): JSX.Element {
  css`
    section {
      max-width: var(--page);
      margin: 0 auto;
      padding: clamp(4rem, 10vw, 8rem) var(--gutter) 0;
    }
    header {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
      gap: 1rem 3rem;
      align-items: end;
      margin-bottom: clamp(2rem, 5vw, 3.5rem);
    }
    .index {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 0;
      color: var(--accent);
      font: 600 0.8125rem/1 var(--font-mono);
      letter-spacing: 0.08em;
    }
    .index::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, var(--line-strong), transparent);
    }
    h2 {
      margin: 0;
      font-size: clamp(1.875rem, 4.4vw, 3.25rem);
      letter-spacing: -0.045em;
    }
    .lead {
      margin: 0;
      color: var(--text-2);
      font-size: clamp(1rem, 1.4vw, 1.125rem);
      max-width: 38rem;
    }
    .lead :global(code) {
      padding: 0.1em 0.35em;
      border-radius: 5px;
      background: var(--surface-2);
      color: var(--text);
      font-size: 0.85em;
    }
    @media (max-width: 52rem) {
      header {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `;

  return (
    <section id={props.id} aria-labelledby={`${props.id}-title`}>
      <header>
        <p class="index" aria-hidden="true">
          {props.index}
        </p>
        <h2 id={`${props.id}-title`}>{props.title}</h2>
        <p class="lead">{props.lead}</p>
      </header>
      {props.children}
    </section>
  );
}
