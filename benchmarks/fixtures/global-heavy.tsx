import { css } from 'solid-styled';

export default function Layout(props: { children: unknown }) {
  css`
    @global {
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      html {
        font-family: system-ui, sans-serif;
        line-height: 1.5;
        -webkit-text-size-adjust: 100%;
      }

      body {
        margin: 0;
        color: #1f2328;
        background-color: #ffffff;
      }

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-weight: 600;
        line-height: 1.25;
      }

      p,
      ul,
      ol,
      dl,
      blockquote,
      pre {
        margin-top: 0;
        margin-bottom: 1rem;
      }

      a {
        color: #0969da;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      img,
      svg,
      video {
        display: block;
        max-width: 100%;
      }

      code,
      kbd,
      samp,
      pre {
        font-family: ui-monospace, monospace;
        font-size: 0.875em;
      }

      table {
        border-collapse: collapse;
        border-spacing: 0;
      }

      th,
      td {
        padding: 6px 13px;
        border: 1px solid #d1d9e0;
      }

      @media (prefers-color-scheme: dark) {
        body {
          color: #f0f6fc;
          background-color: #0d1117;
        }

        a {
          color: #4493f8;
        }
      }
    }

    :global(html.dark) main {
      background-color: #010409;
    }

    :global(body[data-theme='light']) .content :global(a.external) {
      color: #8250df;
    }

    :global(.prose) p,
    :global(.prose) li {
      max-width: 72ch;
    }

    :global(#app) > header {
      position: sticky;
      top: 0;
    }

    main :global(h1),
    main :global(h2),
    main :global(h3) {
      scroll-margin-top: 4rem;
    }

    nav :global(a[aria-current='page']) {
      font-weight: 600;
    }

    :global(.visually-hidden):not(:focus) {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
  `;

  return (
    <div id="app">
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/docs">Docs</a>
        </nav>
      </header>
      <main class="content">{props.children}</main>
    </div>
  );
}
