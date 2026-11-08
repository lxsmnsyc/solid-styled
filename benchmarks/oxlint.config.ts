import { defineConfig } from 'oxlint';
import rootConfig from '../oxlint.config.ts';

// The fixtures are compiler input, not code of this package, so they are not
// linted. The scripts print their results, so `console` is allowed.
export default defineConfig({
  extends: [rootConfig],
  ignorePatterns: ['fixtures/**', 'profiles/**'],
  rules: {
    'no-console': 'off',
  },
});
