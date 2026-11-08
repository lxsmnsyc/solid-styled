import { css } from 'solid-styled';

/**
 * The site's tokens, fonts and base element styles: one `@global` block.
 * Renders nothing; the sheet is the whole point.
 */
export default function GlobalStyles(): null {
  css`
    @global {
      @font-face {
        font-family: 'Geist';
        font-style: normal;
        font-weight: 100 900;
        font-display: optional;
        src: url('/fonts/geist-latin.woff2') format('woff2');
      }

      @font-face {
        font-family: 'JetBrains Mono';
        font-style: normal;
        font-weight: 100 800;
        font-display: optional;
        src: url('/fonts/jetbrains-mono-latin.woff2') format('woff2');
      }

      :root {
        color-scheme: dark light;

        /* Brand */
        --violet-deep: #6b2a92;
        --violet: #8a44c0;
        --orchid: #b24bc4;
        --magenta: #c04ab8;
        --pink: #f58ae6;
        --blush: #ff9ad5;
        --gradient: linear-gradient(
          120deg,
          #6b2a92 0%,
          #8a44c0 26%,
          #b24bc4 50%,
          #c04ab8 64%,
          #f58ae6 86%,
          #ff9ad5 100%
        );

        /* Behind white text: every stop clears 4.5:1 against #fff */
        --gradient-strong: linear-gradient(
          120deg,
          #5a2380 0%,
          #6b2a92 25%,
          #8a44c0 55%,
          #9a3aae 80%,
          #a8329f 100%
        );
        /* Gradient text: every stop clears 4.5:1 against --bg */
        --text-stop-1: light-dark(#6b2a92, #bb8cf0);
        --text-stop-2: light-dark(#8a2fb0, #e48ae6);
        --text-stop-3: light-dark(#a8329f, #ffa6dc);
        --gradient-text: linear-gradient(
          100deg,
          var(--text-stop-1),
          var(--text-stop-2),
          var(--text-stop-3)
        );

        /* Surfaces */
        --bg: light-dark(#fbf7fd, #0d0712);
        --surface: light-dark(#ffffff, #140b1b);
        --surface-2: light-dark(#f3eaf7, #1c1126);
        --code-bg: light-dark(#f6eef9, #150c1d);
        --line: light-dark(#e7dcee, #2a1d35);
        --line-strong: light-dark(#cdb9db, #46315a);

        /* Text: every pair clears 4.5:1 on --bg, --surface and --code-bg */
        --text: light-dark(#1d0f27, #f5edf9);
        --text-2: light-dark(#4d3b5a, #c8b8d4);
        --text-3: light-dark(#685674, #a490b4);
        --accent: light-dark(#8a2fb0, #f58ae6);
        --accent-2: light-dark(#6b2a92, #ff9ad5);
        --on-gradient: #ffffff;
        --focus: light-dark(#8a2fb0, #ff9ad5);
        --glow: light-dark(rgb(178 75 196 / 0.18), rgb(178 75 196 / 0.32));

        /* Type */
        --font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
        --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

        /* Shape and motion */
        --radius: 16px;
        --radius-sm: 10px;
        --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
        --page: 1240px;
        --gutter: clamp(1.25rem, 4vw, 3rem);
      }

      :root[data-theme='light'] {
        color-scheme: light;
      }

      :root[data-theme='dark'] {
        color-scheme: dark;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      html {
        background: var(--bg);
        color: var(--text);
        font: 400 1rem/1.65 var(--font-sans);
        -webkit-text-size-adjust: 100%;
        text-size-adjust: 100%;
        -webkit-font-smoothing: antialiased;
        scroll-padding-top: 5.5rem;
        scrollbar-color: var(--line-strong) var(--bg);
        hanging-punctuation: first;
      }

      body {
        margin: 0;
        min-height: 100vh;
        overflow-x: clip;
      }

      ::selection {
        background: #f58ae6;
        color: #1d0f27;
      }

      :focus-visible {
        outline: 2px solid var(--focus);
        outline-offset: 3px;
        border-radius: 6px;
      }

      h1,
      h2,
      h3,
      h4 {
        font-family: var(--font-mono);
        font-weight: 700;
        line-height: 1.15;
        letter-spacing: -0.02em;
        text-wrap: balance;
      }

      p {
        text-wrap: pretty;
      }

      a {
        color: inherit;
      }

      [hidden] {
        display: none !important;
      }

      svg {
        display: block;
      }

      code,
      kbd,
      pre {
        font-family: var(--font-mono);
        font-feature-settings: 'calt' 0;
      }

      /* Code highlighted at build time; colors switch with the theme. */
      pre.shiki {
        margin: 0;
        padding: 1.25rem 1.375rem;
        overflow-x: auto;
        background: var(--code-bg) !important;
        font-size: 0.8125rem;
        line-height: 1.7;
        tab-size: 2;
        scrollbar-width: thin;
      }

      pre.shiki span {
        color: light-dark(var(--shiki-light), var(--shiki-dark));
      }

      /* Copy buttons are added by the client script, so they live here. */
      .has-copy {
        position: relative;
      }

      .has-copy > .copy {
        position: absolute;
        top: 0.625rem;
        right: 0.625rem;
        height: 1.875rem;
        padding: 0 0.625rem;
        border: 1px solid var(--line-strong);
        border-radius: 7px;
        background: var(--surface);
        color: var(--text-2);
        font: 500 0.6875rem/1 var(--font-mono);
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .has-copy:hover > .copy,
      .has-copy > .copy:focus-visible {
        opacity: 1;
      }

      @media (hover: none) {
        .has-copy > .copy {
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
      }
    }
  `;

  return null;
}
