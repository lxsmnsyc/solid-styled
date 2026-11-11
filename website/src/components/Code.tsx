import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';

interface CodeProps {
  /** Code highlighted at build time. */
  html: string;
  /** A file name or tool shown above the code. */
  label?: string;
}

/** A code panel. The client adds a copy button to every `[data-code]`. */
export default function Code(props: CodeProps): JSX.Element {
  css`
    figure {
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 0;
      margin: 0;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      background: var(--code-bg);
      overflow: hidden;
    }
    figcaption {
      padding: 0.625rem 1.125rem;
      border-bottom: 1px solid var(--line);
      color: var(--text-3);
      font: 500 0.75rem/1.2 var(--font-mono);
    }
    div {
      flex: 1;
      min-width: 0;
    }
  `;

  return (
    <figure>
      {props.label ? <figcaption>{props.label}</figcaption> : null}
      <div data-code innerHTML={props.html} />
    </figure>
  );
}
