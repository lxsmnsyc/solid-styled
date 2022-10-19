import { defineConfig } from 'astro/config';

// https://astro.build/config
import solidJs from "@astrojs/solid-js";
import solidStyled from 'vite-plugin-solid-styled';

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs()],
  vite: {
    plugins: [
      solidStyled({
        prefix: 'example',
        filter: {
          include: 'src/**/*.tsx',
          exclude: 'node_modules/**/*.{ts,js}',
        }
      }),
    ],
  },
});