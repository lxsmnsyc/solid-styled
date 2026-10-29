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
