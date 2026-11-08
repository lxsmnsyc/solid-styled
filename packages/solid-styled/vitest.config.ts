import { defineConfig } from 'vitest/config';

const MODEL = 'test/registry.model.test.ts';
const RUNTIME = 'test/spread.runtime.test.ts';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/**/*.test.ts'],
          exclude: [MODEL, RUNTIME, '**/node_modules/**'],
        },
      },
      {
        // The browser condition makes solid-js and @solidjs/web resolve to
        // their client builds, so `isServer` is false.
        resolve: { conditions: ['browser'] },
        test: {
          name: 'registry-client',
          include: [MODEL],
          environment: 'happy-dom',
        },
      },
      {
        resolve: { conditions: ['browser'] },
        test: {
          name: 'runtime-client',
          include: [RUNTIME],
          environment: 'happy-dom',
          // Compiles the fixtures in Node, where the parsers can load.
          globalSetup: ['test/runtime/compile.ts'],
          // Inlined, so the test, the fixtures and @solidjs/web share one
          // solid-js instance.
          server: { deps: { inline: [/solid-js/, /@solidjs/] } },
        },
      },
      {
        test: {
          name: 'registry-server',
          include: [MODEL],
        },
      },
    ],
  },
});
