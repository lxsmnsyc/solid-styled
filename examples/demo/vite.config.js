import solidStyled from "unplugin-solid-styled";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solidPlugin(),
    solidStyled.vite({
      prefix: "example",
      filter: {
        include: "src/**/*.tsx",
        exclude: "node_modules/**/*.{ts,js}",
      },
    }),
    inspect(),
  ],
});
