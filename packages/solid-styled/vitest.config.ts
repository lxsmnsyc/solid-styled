import { defineConfig } from 'vitest/config';

const MODEL = 'test/registry.model.test.ts';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/**/*.test.ts'],
          exclude: [MODEL, '**/node_modules/**'],
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
        test: {
          name: 'registry-server',
          include: [MODEL],
        },
      },
    ],
  },
});
