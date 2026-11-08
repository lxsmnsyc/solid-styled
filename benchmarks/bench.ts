// Times `compile()` from the built `solid-styled/compiler` on each fixture,
// and the unplugin `transformInclude` + `transform` hooks on a file that has
// no `css`. Run `pnpm build` at the root first.
import { compile } from 'solid-styled/compiler';
import { Bench } from 'tinybench';
import solidStyledPlugin from 'unplugin-solid-styled';
import { BENCH_OPTIONS, FIXTURES, printResults, readFixture } from './shared.ts';

const bench = new Bench(BENCH_OPTIONS);

// `compile()` per fixture, with the default options.
for (const name of FIXTURES) {
  const { id, code } = readFixture(name);
  bench.add(`compile ${name}`, () => {
    compile(id, code);
  });
}

// The unplugin hooks as a bundler calls them: filter on the id, then transform.
// The plugin's hooks are plain functions, so the object form is not handled.
const raw = solidStyledPlugin.raw({}, { framework: 'vite' });
const plugin = Array.isArray(raw) ? raw[0] : raw;
// The plugin still ships `transformInclude`, so the bench times that hook.
// oxlint-disable-next-line typescript/no-deprecated
const { transformInclude, transform } = plugin;
if (typeof transformInclude !== 'function' || typeof transform !== 'function') {
  throw new TypeError('unplugin-solid-styled no longer exposes function hooks');
}
const noStyles = readFixture('no-styles');
if (transformInclude(noStyles.id) !== true) {
  throw new Error(`the unplugin filter skips ${noStyles.id}, so the bench would time nothing`);
}
bench.add('unplugin no-styles', () => {
  if (transformInclude(noStyles.id) === true) {
    // The hook does not read `this`, so an empty context is enough.
    Reflect.apply(transform, {}, [noStyles.code, noStyles.id]);
  }
});

await bench.run();
console.log(`Node ${process.version}, ${process.platform} ${process.arch}`);
printResults(bench);
