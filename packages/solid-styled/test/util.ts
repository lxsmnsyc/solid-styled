import type { SolidStyledOptions } from '../compiler';
import { compile } from '../compiler';

export const FILE = 'src/index.ts';

export const options: SolidStyledOptions = {
  verbose: false,
};

/** Compiles a snippet with the shared defaults and returns only the code. */
export function transform(code: string, overrides: SolidStyledOptions = {}, file = FILE): string {
  return compile(file, code, { ...options, ...overrides }).code;
}
