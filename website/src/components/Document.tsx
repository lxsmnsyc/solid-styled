import type { JSX } from '@solidjs/web';
import { css } from 'solid-styled';
import { SITE_URL, TAGLINE } from '../site';
import Footer from './Footer';
import GlobalStyles from './GlobalStyles';
import Header from './Header';

interface DocumentProps {
  path: string;
  title: string;
  description: string;
  children: JSX.Element;
}

// Runs before first paint, so a stored theme never flashes the other one.
const THEME_SCRIPT =
  "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}";

export default function Document(props: DocumentProps): JSX.Element {
  css`
    .skip {
      position: fixed;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 100;
      padding: 0.625rem 1rem;
      border-radius: var(--radius-sm);
      background: var(--text);
      color: var(--bg);
      font: 600 0.875rem/1 var(--font-mono);
      text-decoration: none;
      transform: translateY(-200%);
    }
    .skip:focus-visible {
      transform: none;
    }
    main {
      display: block;
      min-height: 70vh;
    }
  `;

  const url = `${SITE_URL}${props.path}`;

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title}</title>
        <meta name="description" content={props.description} />
        <meta name="color-scheme" content="dark light" />
        <meta name="theme-color" content="#0d0712" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#fbf7fd" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="solid-styled" />
        <meta property="og:title" content={props.title} />
        <meta property="og:description" content={props.description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={`${SITE_URL}/og.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`solid-styled: ${TAGLINE}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link
          rel="preload"
          href="/fonts/geist-latin.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/jetbrains-mono-latin.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <script innerHTML={THEME_SCRIPT} />
        <script type="module" src="/src/entry-client.ts" />
      </head>
      <body>
        <GlobalStyles />
        <a class="skip" href="#main">
          Skip to content
        </a>
        <Header path={props.path} />
        <main id="main">{props.children}</main>
        <Footer />
      </body>
    </html>
  );
}
