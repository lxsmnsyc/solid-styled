import { renderToString } from '@solidjs/web';
import type { StyleData } from 'solid-styled';
import { StyleRegistry, renderSheets } from 'solid-styled';
import App from './App';
import { SHEET_COUNT_TOKEN } from './site';

/**
 * Renders one page to a full HTML document. Every sheet used during the
 * render is collected by `StyleRegistry` and written into `<head>`, so the
 * prerendered page is styled before any script runs.
 */
export function render(request: Request): string {
  const { pathname } = new URL(request.url);
  const styles: StyleData[] = [];

  const html = renderToString(() => (
    <StyleRegistry styles={styles}>
      <App path={pathname} />
    </StyleRegistry>
  ));

  // The landing page quotes how many sheets it carries; the number is only
  // known once the render has finished.
  return html
    .replace('</head>', `${renderSheets(styles)}</head>`)
    .replaceAll(SHEET_COUNT_TOKEN, String(styles.length));
}
