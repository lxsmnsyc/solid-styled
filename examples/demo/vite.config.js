import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import solidStyled from 'babel-plugin-solid-styled';

export default defineConfig({
  plugins: [
    solidPlugin({
      babel: {
        plugins: [
          [solidStyled, { verbose: true }]
        ],
      },
    }),
  ],
});
