import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from '@solidjs/compiler';
import type { TestProject } from 'vitest/node';
import { compile } from '../../compiler';

declare module 'vitest' {
  export interface ProvidedContext {
    spreadCases: string;
  }
}

/**
 * Compiles the runtime fixtures with solid-styled, then Solid's compiler.
 * It runs in Node, outside the browser resolve condition the tests use,
 * because the parsers load native bindings.
 */
export default function compileFixtures(project: TestProject): void {
  const file = join(import.meta.dirname, 'spread-cases.jsx');
  const styled = compile(file, readFileSync(file, 'utf8')).code;
  const { code } = transform(styled, { filename: file, generate: 'dom' });
  project.provide('spreadCases', code);
}
