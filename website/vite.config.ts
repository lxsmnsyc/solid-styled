import path from 'node:path';
import solid from '@solidjs/vite-plugin';
import solidStyled from 'unplugin-solid-styled';
import { defineConfig } from 'vite';
import site from './plugins/site.ts';

export default defineConfig({
  plugins: [
    // SSR start mode with authored entries: the server entry renders each
    // page with a StyleRegistry, the client entry mounts the islands only.
    // `renderMode: 'async'` sends one finished document per page, which the
    // prerender step writes to `dist/client`.
    solid({
      ssr: true,
      start: {
        renderMode: 'async',
        devtools: false,
      },
    }),
    solidStyled.vite({
      filter: {
        include: path.join(import.meta.dirname, 'src/**/*.tsx'),
      },
    }),
    site(),
  ],
  define: {
    'import.meta.env.SITE_URL': JSON.stringify(process.env.SITE_URL ?? ''),
  },
});
