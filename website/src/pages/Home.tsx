import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';
import content from 'virtual:site-content';
import Code from '../components/Code';
import Mark from '../components/Mark';
import Section from '../components/Section';
import Boundary from '../demos/Boundary';
import Forward from '../demos/Forward';
import Tags from '../demos/Tags';
import Playground from '../islands/Playground';
import { INSTALL, REPO_URL, SHEET_COUNT_TOKEN, TAGLINE } from '../site';

function formatKilobytes(bytes: number): string {
  return (bytes / 1024).toFixed(1);
}

function Hero(): JSX.Element {
  css`
    .hero {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      gap: 2rem;
      align-items: center;
      max-width: var(--page);
      min-height: min(52rem, calc(100svh - 4rem));
      margin: 0 auto;
      padding: clamp(3rem, 8vw, 6rem) var(--gutter) clamp(3rem, 6vw, 5rem);
    }
    .copy {
      position: relative;
      z-index: 1;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      margin: 0 0 1.75rem;
      padding: 0.375rem 0.875rem 0.375rem 0.375rem;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
      color: var(--text-2);
      font: 500 0.75rem/1 var(--font-mono);
    }
    .eyebrow b {
      padding: 0.3125rem 0.5rem;
      border-radius: 999px;
      background: var(--gradient-strong);
      color: var(--on-gradient);
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: clamp(2.75rem, 9.6vw, 7.75rem);
      font-weight: 800;
      line-height: 0.92;
      letter-spacing: -0.065em;
    }
    h1 span {
      background: var(--gradient-text);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .tagline {
      max-width: 26ch;
      margin: 1.5rem 0 2.5rem;
      color: var(--text-2);
      font-size: clamp(1.25rem, 2.3vw, 1.75rem);
      line-height: 1.3;
      letter-spacing: -0.015em;
    }
    .install {
      position: relative;
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      height: 3.25rem;
      padding: 0 4.5rem 0 1.25rem;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius-sm);
      background: var(--code-bg);
      font: 500 0.9375rem/1 var(--font-mono);
    }
    .install code::before {
      content: '$ ';
      color: var(--text-3);
    }
    .install button {
      position: absolute;
      top: 50%;
      right: 0.5rem;
      translate: 0 -50%;
      height: 2.25rem;
      padding: 0 0.75rem;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: var(--surface);
      color: var(--text-2);
      font: 500 0.75rem/1 var(--font-mono);
      cursor: pointer;
    }
    .install button:hover {
      color: var(--text);
      border-color: var(--line-strong);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .actions a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      height: 3.25rem;
      padding: 0 1.5rem;
      border-radius: var(--radius-sm);
      font: 600 0.9375rem/1 var(--font-mono);
      text-decoration: none;
      transition:
        transform 0.3s var(--ease),
        box-shadow 0.3s var(--ease);
    }
    .primary {
      background: var(--gradient-strong);
      color: var(--on-gradient);
      box-shadow: 0 10px 30px -12px rgb(178 75 196 / 0.7);
    }
    .primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 36px -12px rgb(178 75 196 / 0.85);
    }
    .secondary {
      border: 1px solid var(--line-strong);
      color: var(--text);
    }
    .secondary:hover {
      background: var(--surface-2);
    }
    .art {
      --px: 0;
      --py: 0;
      position: relative;
      aspect-ratio: 1;
      width: 100%;
      max-width: 34rem;
      justify-self: end;
    }
    .art::before {
      content: '';
      position: absolute;
      inset: 4%;
      border-radius: 50%;
      background: radial-gradient(circle, var(--glow), transparent 68%);
      filter: blur(24px);
    }
    .mark {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .mark :global(.ribbon) {
      animation: enter 1.1s var(--ease) both;
    }
    .mark :global(.ribbon-top) {
      --from: -14% -10%;
    }
    .mark :global(.ribbon-spine) {
      --from: 0 6%;
      animation-delay: 0.12s;
    }
    .mark :global(.ribbon-bottom) {
      --from: 14% 10%;
      animation-delay: 0.24s;
    }
    @keyframes enter {
      from {
        opacity: 0;
        translate: var(--from);
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .mark :global(.ribbon) > :global(polygon) {
        transition: transform 0.6s var(--ease);
      }
      .mark :global(.ribbon-top) > :global(polygon) {
        transform: translate(calc(var(--px) * -5px), calc(var(--py) * -4px));
      }
      .mark :global(.ribbon-spine) > :global(polygon) {
        transform: translate(calc(var(--px) * 3px), calc(var(--py) * 3px));
      }
      .mark :global(.ribbon-bottom) > :global(polygon) {
        transform: translate(calc(var(--px) * 7px), calc(var(--py) * 5px));
      }
      @supports (animation-timeline: scroll()) {
        .art {
          animation: drift linear both;
          animation-timeline: scroll(root);
          animation-range: 0 100vh;
        }
      }
    }
    @keyframes drift {
      to {
        rotate: -6deg;
        scale: 0.92;
        opacity: 0.55;
      }
    }
    @media (max-width: 52rem) {
      .hero {
        grid-template-columns: minmax(0, 1fr);
        min-height: 0;
        padding-top: 2.5rem;
      }
      .art {
        grid-row: 1;
        justify-self: start;
        width: min(46vw, 12rem);
      }
    }
  `;

  return (
    <section class="hero" aria-labelledby="hero-title">
      <div class="copy">
        <p class="eyebrow">
          <b>v{content.stats.version}</b>
          for Solid 2.0
        </p>
        <h1 id="hero-title">
          solid-<span>styled</span>
        </h1>
        <p class="tagline">{TAGLINE}</p>
        <div class="install">
          <code>{INSTALL}</code>
          <button type="button" data-copy-text={INSTALL} hidden>
            Copy
          </button>
        </div>
        <div class="actions">
          <a class="primary" href="/docs/setup/">
            Read the docs
          </a>
          <a class="secondary" href={REPO_URL}>
            GitHub
          </a>
        </div>
      </div>
      <div class="art" data-hero-art>
        <Mark id="hero-mark" class="mark" use:solid-styled />
      </div>
    </section>
  );
}

function Compiled(): JSX.Element {
  const { css: cssSample, styleJsx } = content.samples;
  const sameSheet = cssSample.sheet === styleJsx.sheet;

  css`
    .tabs {
      display: flex;
      gap: 0.25rem;
      width: fit-content;
      margin-bottom: 1rem;
      padding: 0.25rem;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--surface);
    }
    [role='tab'] {
      height: 2.25rem;
      padding: 0 1rem;
      border: 0;
      border-radius: 999px;
      background: none;
      color: var(--text-2);
      font: 500 0.8125rem/1 var(--font-mono);
      cursor: pointer;
    }
    [role='tab'][aria-selected='true'] {
      background: var(--surface-2);
      color: var(--text);
      box-shadow: inset 0 0 0 1px var(--line-strong);
    }
    .pair {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 1rem;
    }
    .sheet {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 1rem;
      align-items: center;
      margin-top: 1rem;
      padding: 0.25rem 0.25rem 0.25rem 1.25rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      background: var(--surface);
    }
    .sheet p {
      margin: 0;
      color: var(--text-3);
      font: 500 0.75rem/1.4 var(--font-mono);
    }
    .sheet :global(pre) {
      border-radius: 7px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    @media (max-width: 60rem) {
      .pair,
      .sheet {
        grid-template-columns: minmax(0, 1fr);
      }
      .sheet {
        padding: 1rem 0.25rem 0.25rem;
      }
      .sheet p {
        padding-left: 1rem;
      }
    }
  `;

  return (
    <div data-tabs>
      <div class="tabs" role="tablist" aria-label="Source syntax">
        <button
          type="button"
          role="tab"
          id="tab-css"
          aria-controls="panel-css"
          aria-selected="true"
        >
          css``
        </button>
        <button
          type="button"
          role="tab"
          id="tab-jsx"
          aria-controls="panel-jsx"
          aria-selected="false"
          tabindex="-1"
        >
          {'<style jsx>'}
        </button>
      </div>
      <div role="tabpanel" id="panel-css" aria-labelledby="tab-css" class="pair">
        <Code label="Button.tsx" html={cssSample.source} />
        <Code label="solid-styled/compiler" html={cssSample.output} />
      </div>
      <div role="tabpanel" id="panel-jsx" aria-labelledby="tab-jsx" class="pair" hidden>
        <Code label="Button.tsx" html={styleJsx.source} />
        <Code label="solid-styled/compiler" html={styleJsx.output} />
      </div>
      <div class="sheet">
        <p>{sameSheet ? 'Both spellings, one sheet' : 'Sheet'}</p>
        <div innerHTML={cssSample.sheetHtml} />
      </div>
    </div>
  );
}

function Live(): JSX.Element {
  const { ribbons } = content.samples;

  css`
    details {
      margin-top: 1.5rem;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      background: var(--surface);
    }
    summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      font: 500 0.875rem/1.2 var(--font-mono);
      cursor: pointer;
      list-style: none;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary::before {
      content: '+';
      display: grid;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 6px;
      background: var(--surface-2);
      color: var(--accent);
      font-weight: 700;
    }
    details[open] summary::before {
      content: '−';
    }
    .pair {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 1rem;
      padding: 0 1rem 1rem;
    }
    @media (max-width: 60rem) {
      .pair {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `;

  return (
    <>
      <div data-island="playground">
        <Playground />
      </div>
      <details>
        <summary>Ribbons.tsx before and after the compiler</summary>
        <div class="pair">
          <Code label="src/islands/Ribbons.tsx" html={ribbons.source} />
          <Code label="solid-styled/compiler" html={ribbons.output} />
        </div>
      </details>
    </>
  );
}

function Scoping(): JSX.Element {
  css`
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }
    article {
      display: flex;
      flex-direction: column;
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      overflow: hidden;
    }
    .text {
      padding: 1.5rem 1.5rem 1.25rem;
    }
    h3 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
    }
    p {
      margin: 0;
      color: var(--text-2);
      font-size: 0.9375rem;
    }
    .stage {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1.5rem;
      min-height: 7rem;
      margin: 0 1.5rem 1.25rem;
      padding: 1.25rem 1.5rem;
      border: 1px dashed var(--line-strong);
      border-radius: var(--radius-sm);
      font: 500 0.875rem/1.4 var(--font-mono);
    }
    .stage :global(p) {
      margin: 0;
    }
    .code {
      margin-top: auto;
      border-top: 1px solid var(--line);
      max-height: 22rem;
      overflow: auto;
    }
    .global {
      justify-content: space-between;
    }
    .global .stage {
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 0.25rem;
      border-style: solid;
      background: var(--code-bg);
    }
    .number {
      font: 800 clamp(2.5rem, 6vw, 4rem)/1 var(--font-mono);
      letter-spacing: -0.06em;
      background: var(--gradient-text);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .unit {
      color: var(--text-3);
    }
    .text a {
      color: var(--accent);
    }
    @media (max-width: 52rem) {
      .grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `;

  return (
    <div class="grid">
      <article>
        <div class="text">
          <h3>Scoped by default</h3>
          <p>
            Elements the component writes, children included, carry its scope. Elements another
            component renders do not.
          </p>
        </div>
        <div class="stage">
          <Boundary />
        </div>
        <div class="code" innerHTML={content.sources['Boundary.tsx']} />
      </article>
      <article>
        <div class="text">
          <h3>
            <code>:global(…)</code>
          </h3>
          <p>
            Opts one selector out of scoping, here to reach spans rendered by a child component.
          </p>
        </div>
        <div class="stage">
          <Tags />
        </div>
        <div class="code" innerHTML={content.sources['Tags.tsx']} />
      </article>
      <article>
        <div class="text">
          <h3>
            <code>use:solid-styled</code>
          </h3>
          <p>
            Forwards the scope to a component, such as <code>Dynamic</code>, that spreads its props
            on an element.
          </p>
        </div>
        <div class="stage">
          <Forward />
        </div>
        <div class="code" innerHTML={content.sources['Forward.tsx']} />
      </article>
      <article class="global">
        <div class="text">
          <h3>
            <code>@global</code>
          </h3>
          <p>
            Hoists a block out of scoping. This site's fonts, tokens and base styles are one{' '}
            <code>@global</code> block in{' '}
            <a href={`${REPO_URL}/blob/main/website/src/components/GlobalStyles.tsx`}>
              GlobalStyles.tsx
            </a>
            .
          </p>
        </div>
        <div class="stage">
          <span class="number">{formatKilobytes(content.stats.globalSheetBytes)}</span>
          <span class="unit">kB after LightningCSS</span>
        </div>
      </article>
    </div>
  );
}

function Platform(): JSX.Element {
  css`
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
      grid-template-rows: auto auto;
      gap: 1rem;
    }
    article {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      min-width: 0;
      padding: 1.5rem;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
    }
    .ssr {
      grid-row: span 2;
    }
    h3 {
      margin: 0;
      font-size: 1.125rem;
    }
    p {
      margin: 0;
      color: var(--text-2);
      font-size: 0.9375rem;
    }
    p code {
      font-size: 0.875em;
      color: var(--text);
    }
    .number {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      font: 800 clamp(3rem, 7vw, 4.75rem)/1 var(--font-mono);
      letter-spacing: -0.06em;
    }
    .number small {
      color: var(--text-3);
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: 0;
    }
    .count {
      color: var(--accent);
    }
    @media (max-width: 52rem) {
      .grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .ssr {
        grid-row: auto;
      }
    }
  `;

  return (
    <div class="grid">
      <article class="ssr">
        <h3>Server rendered, no flash</h3>
        <p>
          <code>StyleRegistry</code> collects every sheet used during a render. This page was
          prerendered that way and carries <strong class="count">{SHEET_COUNT_TOKEN}</strong> sheets
          in its <code>&lt;head&gt;</code>. On the client, sheets already there are matched by their{' '}
          <code>s:id</code> and not inserted again.
        </p>
        <Code label="docs/ssr.md" html={content.snippets.ssr} />
      </article>
      <article>
        <h3>Near zero runtime</h3>
        <div class="number">
          {formatKilobytes(content.stats.runtimeGzip)}
          <small>kB gzipped</small>
        </div>
        <p>
          The whole runtime: insert a sheet once, count references, remove it with the last user.
          Everything else happens at build time.
        </p>
      </article>
      <article>
        <h3>Any bundler</h3>
        <p>
          <code>unplugin-solid-styled</code> runs ahead of the Solid JSX transform.
        </p>
        <Code html={content.snippets.bundlers} />
      </article>
    </div>
  );
}

export default function Home(): JSX.Element {
  css`
    .next {
      max-width: var(--page);
      margin: 0 auto;
      padding: clamp(4rem, 10vw, 8rem) var(--gutter) 0;
    }
    .next a {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 1rem;
      align-items: center;
      padding: clamp(1.75rem, 5vw, 3rem);
      border-radius: var(--radius);
      background: var(--gradient-strong);
      color: var(--on-gradient);
      text-decoration: none;
      transition: transform 0.4s var(--ease);
    }
    .next a:hover {
      transform: translateY(-3px);
    }
    .next span {
      font: 800 clamp(1.5rem, 4vw, 2.75rem)/1.05 var(--font-mono);
      letter-spacing: -0.045em;
    }
    .next small {
      display: block;
      margin-bottom: 0.5rem;
      font: 500 0.875rem/1.2 var(--font-mono);
      letter-spacing: 0;
      opacity: 0.85;
    }
    svg {
      width: clamp(2rem, 5vw, 3.5rem);
      height: auto;
      transition: transform 0.4s var(--ease);
    }
    .next a:hover svg {
      transform: translateX(6px);
    }
  `;

  return (
    <>
      <Hero />
      <Section
        id="compile"
        index="01"
        title="Write CSS. Ship scoped CSS."
        lead={
          <>
            Each template compiles to a static sheet scoped to its component, and each{' '}
            <code>${'{…}'}</code> becomes a CSS variable. The output below came from{' '}
            <code>solid-styled/compiler</code> when this page was built.
          </>
        }
      >
        <Compiled />
      </Section>
      <Section
        id="reactive"
        index="02"
        title="Values change. The sheet stays."
        lead={
          <>
            Interpolated values are written to the component's own elements as custom properties.
            Move a slider: the <code>style</code> attribute updates, the sheet in{' '}
            <code>&lt;head&gt;</code> is never rewritten.
          </>
        }
      >
        <Live />
      </Section>
      <Section
        id="scoping"
        index="03"
        title="Styles stay where you wrote them."
        lead={
          <>
            Each element a component writes gets its scope attribute, and every selector in its
            sheet requires it. These demos are live solid-styled components.
          </>
        }
      >
        <Scoping />
      </Section>
      <Section
        id="platform"
        index="04"
        title="Compiled ahead. Rendered on the server."
        lead={
          <>
            The compiler parses with oxc and lowers and minifies with LightningCSS. What reaches the
            browser is a string and a few function calls.
          </>
        }
      >
        <Platform />
      </Section>
      <div class="next">
        <a href="/docs/setup/">
          <span>
            <small>Next</small>
            Set up solid-styled
          </span>
          <svg
            viewBox="0 0 48 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path d="M0 12h44M34 2l10 10-10 10" />
          </svg>
        </a>
      </div>
    </>
  );
}
