// Times the pieces `compile()` is built from, one at a time, so each suspect
// from the bench-baseline brief gets its own number. The calls mirror the ones
// in packages/solid-styled/compiler (same libraries, same options).
import browserslist from 'browserslist';
import * as csstree from 'css-tree';
import * as lightningcss from 'lightningcss';
import MagicString from 'magic-string';
import { parseSync } from 'oxc-parser';
import { Bench } from 'tinybench';
import { BENCH_OPTIONS, printResults, readFixture } from './shared.ts';

const large = readFixture('large');
const noStyles = readFixture('no-styles');

const FEATURES =
  lightningcss.Features.Nesting |
  lightningcss.Features.Colors |
  lightningcss.Features.CustomMediaQueries;

const PARSE_OPTIONS = { lang: 'tsx', sourceType: 'module' } as const;
// `experimentalRawTransfer` is read by oxc-parser's JS wrapper but missing
// from its types, so it is passed through a variable.
const RAW_OPTIONS = { ...PARSE_OPTIONS, experimentalRawTransfer: true };

/** The first `css` template of the large fixture, with interpolations as `var()`. */
function extractSheet(code: string): string {
  const start = code.indexOf('css`') + 4;
  const end = code.indexOf('`;', start);
  return code.slice(start, end).replaceAll(/\$\{[^}]*\}/g, 'var(--s-v-0)');
}

/** Spans of every `css` template in the file, as the transform overwrites them. */
function findTemplateSpans(code: string): [number, number][] {
  const spans: [number, number][] = [];
  let from = 0;
  for (;;) {
    const start = code.indexOf('css`', from);
    if (start === -1) {
      return spans;
    }
    const end = code.indexOf('`;', start) + 1;
    spans.push([start, end]);
    from = end;
  }
}

const sheet = extractSheet(large.code);
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const targets = lightningcss.browserslistToTargets(browserslist('defaults'));

function runLightning(content: string, resolvedTargets: lightningcss.Targets): string {
  const { code } = lightningcss.transform({
    code: encoder.encode(content),
    filename: 'bench',
    minify: true,
    targets: resolvedTargets,
    include: FEATURES,
  });
  return decoder.decode(code);
}

const preprocessed = runLightning(sheet, targets);
const spans = findTemplateSpans(large.code);

/** Applies edits shaped like the transform's: a hoisted const and a call per template. */
function editLarge(): MagicString {
  const s = new MagicString(large.code);
  s.prepend('import { useSolidStyled as _useSolidStyled } from "solid-styled";\n');
  for (const [start, end] of spans) {
    s.appendLeft(start, 'const css_1 = "...";\n');
    s.overwrite(start, end, '_useSolidStyled(sheet_1, 1, css_1)');
  }
  return s;
}

function ignoreNode(): void {
  // Visits every node and does nothing, to time the walk alone.
}

const bench = new Bench(BENCH_OPTIONS);

// Suspect: browserslist resolved on every preprocessCSS call.
bench.add("browserslist('defaults')", () => {
  browserslist('defaults');
});
bench.add('browserslistToTargets(browserslist())', () => {
  lightningcss.browserslistToTargets(browserslist('defaults'));
});

// Suspect: each scoped sheet goes LightningCSS -> css-tree -> LightningCSS.
bench.add('lightningcss.transform, one sheet, cached targets', () => {
  runLightning(sheet, targets);
});
bench.add('lightningcss.transform, one sheet, targets per call', () => {
  runLightning(sheet, lightningcss.browserslistToTargets(browserslist('defaults')));
});
bench.add('css-tree parse + 2 walks + generate, one sheet', () => {
  const ast = csstree.parse(preprocessed);
  csstree.walk(ast, ignoreNode);
  csstree.walk(ast, ignoreNode);
  csstree.generate(ast);
});

// Suspect: full parse even when the file never imports solid-styled.
bench.add(
  'oxc parseSync no-styles (+ program)',
  () => parseSync(noStyles.id, noStyles.code, PARSE_OPTIONS).program,
);
bench.add(
  "no-styles string check (includes 'solid-styled' or '<style')",
  () => noStyles.code.includes('solid-styled') || noStyles.code.includes('<style'),
);
bench.add(
  'oxc parseSync large (+ program), JSON transfer',
  () => parseSync(large.id, large.code, PARSE_OPTIONS).program,
);
bench.add(
  'oxc parseSync large (+ program), raw transfer',
  () => parseSync(large.id, large.code, RAW_OPTIONS).program,
);

// Suspect: hires source maps.
bench.add('MagicString large: edits + toString', () => {
  editLarge().toString();
});
bench.add('MagicString large: edits + toString + generateMap hires', () => {
  const s = editLarge();
  s.toString();
  s.generateMap({ source: large.id, hires: true });
});
bench.add('MagicString large: edits + toString + generateMap lowres', () => {
  const s = editLarge();
  s.toString();
  s.generateMap({ source: large.id });
});
bench.add('MagicString no-styles: no edits + generateMap hires', () => {
  const s = new MagicString(noStyles.code);
  s.toString();
  s.generateMap({ source: noStyles.id, hires: true });
});

await bench.run();
console.log(`Node ${process.version}, ${process.platform} ${process.arch}`);
console.log(`large fixture: ${spans.length} css templates, sheet of ${sheet.length} chars`);
printResults(bench);
