import selfConfig from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [selfConfig],
  ignorePatterns: ['**/dist/**', '**/node_modules/**'],
  overrides: [
    {
      // The compiler works on a structural AST type; property access is
      // inherently untyped there, and the css-tree node union is far too
      // wide to enumerate in a switch.
      files: ['packages/solid-styled/compiler/**', 'packages/solid-styled/test/**'],
      rules: {
        'typescript/no-unsafe-argument': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/no-unnecessary-condition': 'off',
        'typescript/no-explicit-any': 'off',
        'typescript/switch-exhaustiveness-check': 'off',
      },
    },
    {
      // Vendored xxHash32 implementation; kept close to the reference source.
      files: ['packages/solid-styled/compiler/xxhash32.ts'],
      rules: {
        'no-shadow': 'off',
      },
    },
    {
      // Bridging unplugin's generic plugin shape onto each bundler's own
      // `Plugin` type needs assertions the type checker cannot verify.
      files: ['packages/unplugin/src/**'],
      rules: {
        'typescript/no-unsafe-type-assertion': 'off',
      },
    },
    {
      // Example apps log on purpose, and `css` sheets are tagged templates
      // used as statements.
      files: ['examples/**'],
      rules: {
        'no-console': 'off',
        'no-unused-expressions': 'off',
      },
    },
    {
      // The website writes `css` sheets as tagged templates used as
      // statements, and its preview script logs the address it serves.
      files: ['website/**'],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      files: ['website/scripts/**'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // @solidjs/vite-plugin requires a named `render` export from the
      // server entry.
      files: ['website/src/entry-server.tsx'],
      rules: {
        'import/prefer-default-export': 'off',
      },
    },
    {
      // A module with no imports reads as a script to this rule, but Vite
      // loads the entry as a module, so nothing leaks into the global scope.
      files: ['website/src/entry-client.ts'],
      rules: {
        'no-implicit-globals': 'off',
      },
    },
    {
      // An ambient module declaration cannot use a top-level import.
      files: ['website/src/env.d.ts'],
      rules: {
        'typescript/consistent-type-imports': 'off',
      },
    },
    {
      // Global JSX declarations mirror Solid's own type shapes.
      files: ['packages/solid-styled/src/index.ts'],
      rules: {
        'no-unused-vars': 'off',
        'typescript/no-explicit-any': 'off',
        'typescript/no-empty-object-type': 'off',
        'typescript/no-namespace': 'off',
      },
    },
  ],
});
