import MagicString from 'magic-string';
import { parseSync } from 'oxc-parser';
import { analyze } from './core/analyze';
import { Ctx } from './core/context';
import { CompileError } from './core/errors';
import transform from './core/transform';
import type { CompileOutput, SolidStyledOptions } from './types';
import xxHash32 from './xxhash32';

export type { CompileOutput, SolidStyledOptions };
export { CompileError };

const TS_FILE = /\.[mc]?tsx?$/i;

/**
 * Infers the parser language from the file extension; query suffixes ignored.
 * JSX stays enabled for plain `.ts` too, so components written in `.ts` files
 * keep compiling.
 */
function languageOf(filename: string): 'jsx' | 'tsx' {
  return TS_FILE.test(filename.split('?')[0]) ? 'tsx' : 'jsx';
}

/**
 * Compiles a module: parse with oxc, collect the templates and JSX elements
 * (`analyze`), apply every rewrite as a span edit over a MagicString
 * (`transform`), and return the code plus a hires source map.
 */
export function compile(id: string, code: string, options: SolidStyledOptions = {}): CompileOutput {
  const filename = id.split('?')[0];
  const result = parseSync(filename, code, {
    lang: languageOf(id),
    sourceType: 'module',
    preserveParens: false,
  });
  if (result.errors.length > 0) {
    const first = result.errors[0];
    throw new CompileError(first.message, code, first.labels?.[0]?.start ?? 0);
  }
  const s = new MagicString(code);
  const analysis = analyze(result.program);
  const ctx = new Ctx(s, code, analysis, options, xxHash32(filename).toString(16));
  transform(ctx);
  return {
    code: s.toString(),
    map: s.generateMap({ source: id, hires: true }),
  };
}
