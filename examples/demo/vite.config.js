import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import solidStyled from 'unplugin-solid-styled';

export default defineConfig({
  plugins: [
    solidPlugin(),
    solidStyled.vite({
      prefix: 'example',
      filter: {
        include: 'src/**/*.tsx',
        exclude: 'node_modules/**/*.{ts,js}',
      }
    }),
  ],
});
