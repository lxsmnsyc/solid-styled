import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import solidStyled from 'solid-styled/babel';

export default defineConfig({
  plugins: [
    solidPlugin({
      babel: {
        plugins: [
          [solidStyled, {
            verbose: true,
            prefix: 'example',
            // ssr: true
          }]
        ],
      },
    }),
  ],
});
