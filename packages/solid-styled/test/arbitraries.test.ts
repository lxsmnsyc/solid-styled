import * as csstree from 'css-tree';
import fc from 'fast-check';
import { parseSync } from 'oxc-parser';
import { compile as compileLegacy } from 'solid-styled-legacy/compiler';
import { describe, expect, it } from 'vitest';
import { CompileError, compile } from '../compiler';
import {
  CONTROL_KINDS,
  type GeneratedModule,
  IMPORT_FORMS,
  SHADOW_KINDS,
  component,
  countCompiled,
  cssTemplate,
  invalidComponent,
} from './arbitraries';

const FILE = 'src/index.tsx';

// Set FC_RUNS and FC_SEED to search wider than the default run.
const RUNS = Number(process.env.FC_RUNS ?? 150);
const SEED = Number(process.env.FC_SEED ?? 20261108);

/** Runs at most `max` times by default; `FC_RUNS` scales every property alike. */
function params(max: number): fc.Parameters<unknown> {
  return { seed: SEED, numRuns: Math.max(1, Math.round((max * RUNS) / 150)) };
}

// The per-test timeout grows with FC_RUNS: about 40 ms per run, at least 5 s.
const TIMEOUT = Math.max(5000, RUNS * 40);

function listParseErrors(code: string): string[] {
  const messages: string[] = [];
  for (const error of parseSync(FILE, code).errors) {
    messages.push(error.message);
  }
  return messages;
}

function countExpected(module: GeneratedModule): number {
  let total = 0;
  for (const template of module.templates) {
    if (template.compiled) {
      total += 1;
    }
  }
  return total;
}

/** Asserts that each untouched template remains, and each compiled one is gone. */
function expectMarkers(module: GeneratedModule, output: string): void {
  for (const template of module.templates) {
    const remains = output.includes(`\`${template.marker}`);
    expect(remains, `${template.marker} (${template.kind}) remains`).toBe(!template.compiled);
  }
}

function checkModule(module: GeneratedModule, output: string): void {
  expect(countCompiled(output)).toBe(countExpected(module));
  expectMarkers(module, output);
}

describe('cssTemplate', () => {
  it(
    'records every interpolation in source order',
    () => {
      fc.assert(
        fc.property(cssTemplate(), ({ source, vars }) => {
          // Read the expressions back from the parsed template literal.
          const code = `x = \`${source}\`;`;
          const { program, errors } = parseSync('t.js', code);
          expect(errors).toEqual([]);
          const statement = program.body[0];
          if (
            statement.type !== 'ExpressionStatement' ||
            statement.expression.type !== 'AssignmentExpression' ||
            statement.expression.right.type !== 'TemplateLiteral'
          ) {
            throw new Error('expected a template literal');
          }
          const found: string[] = [];
          for (const expression of statement.expression.right.expressions) {
            found.push(code.slice(expression.start, expression.end));
          }
          expect(found).toEqual(vars);
        }),
        params(150),
      );
    },
    TIMEOUT,
  );

  it(
    'writes declarations that are valid for their property',
    () => {
      fc.assert(
        fc.property(cssTemplate(), ({ sample }) => {
          const invalid: string[] = [];
          csstree.walk(csstree.parse(sample), {
            visit: 'Declaration',
            enter(node) {
              if (csstree.lexer.matchDeclaration(node).error) {
                invalid.push(csstree.generate(node));
              }
            },
          });
          expect(invalid).toEqual([]);
        }),
        params(150),
      );
    },
    TIMEOUT,
  );

  it('leaves out the at-rules and :global when asked', () => {
    fc.assert(
      fc.property(cssTemplate({ global: false, keyframes: false, media: false }), ({ source }) => {
        expect(source).not.toMatch(/@|:global/);
      }),
      params(50),
    );
  });
});

describe('countCompiled', () => {
  it('counts every local name the compilers use', () => {
    const code = [
      '_useSolidStyled(a, 1, b);',
      '_useSolidStyled_1(a, 2, b);',
      '(_useSolidStyledGlobal(a, 3, b), vars_1(() => ({})));',
      'useSolidStyled_1(a, 4, b), vars_1(() => ({}));',
      'useSolidStyledGlobal_1(a, 5, b);',
      'useSolidStyledX(a); x.useSolidStyled(a); __useSolidStyled(a);',
    ].join('\n');
    expect(countCompiled(code)).toBe(5);
  });
});

describe('component', () => {
  it(
    'parses, compiles to the expected templates, and the output reparses',
    () => {
      fc.assert(
        fc.property(component(), fc.boolean(), (module, verbose) => {
          expect(listParseErrors(module.code)).toEqual([]);
          const { code } = compile(FILE, module.code, { verbose });
          // `countCompiled` throws when the output does not parse.
          checkModule(module, code);
        }),
        params(150),
      );
    },
    TIMEOUT,
  );

  const scoped = ['named', 'aliased', 'namespace', 'two-aliases'] as const;

  it.each(SHADOW_KINDS)('leaves css alone under shadow kind %s', (shadow) => {
    fc.assert(
      fc.property(
        component({ imports: scoped, shadows: [shadow], controls: [], modulePoison: false }),
        (module) => {
          checkModule(module, compile(FILE, module.code).code);
        },
      ),
      params(12),
    );
  });

  it.each(CONTROL_KINDS)('compiles css next to control kind %s', (control) => {
    fc.assert(
      fc.property(
        component({ imports: scoped, shadows: [], controls: [control], modulePoison: false }),
        (module) => {
          checkModule(module, compile(FILE, module.code).code);
        },
      ),
      params(12),
    );
  });

  it(
    'agrees with the 0.12.1 compiler',
    async () => {
      // Babel rejects the module-level `var` that redeclares the import.
      const modules = component({ imports: IMPORT_FORMS, modulePoison: false });
      await fc.assert(
        fc.asyncProperty(modules, async (module) => {
          const { code } = await compileLegacy(FILE, module.code, {});
          checkModule(module, code);
        }),
        params(30),
      );
    },
    TIMEOUT,
  );
});

describe('invalidComponent', () => {
  it('throws a CompileError', () => {
    fc.assert(
      fc.property(invalidComponent(), ({ code, reason }) => {
        expect(() => compile(FILE, code), reason).toThrow(CompileError);
      }),
      params(30),
    );
  });
});

// Minimal counterexamples for compiler bugs found by these generators. The
// fixed ones stay as regression tests. `it.fails` marks a bug still open and
// turns red once it is fixed.
describe('compiler bugs found by the generators', () => {
  // A type import has no runtime value. 0.12.1 leaves the template alone.
  it('leaves css alone when it is imported as a type', () => {
    const code = `import type { css } from 'solid-styled';\nexport function C() {\ncss\`a{color:red}\`;\nreturn <a />;\n}\n`;
    expect(compile(FILE, code).code).toContain('css`a{color:red}`');
  });

  it('leaves css alone when it is imported with a type specifier', () => {
    const code = `import { type css } from 'solid-styled';\nexport function C() {\ncss\`a{color:red}\`;\nreturn <a />;\n}\n`;
    expect(compile(FILE, code).code).toContain('css`a{color:red}`');
  });

  // The hoisted call used to land between `export` and `const`. 0.12.1 emits
  // valid code.
  it('emits valid code for an exported expression-body arrow with <style jsx>', () => {
    const code = 'export const C = () => <div><style jsx>{`a{color:red}`}</style></div>;\n';
    expect(listParseErrors(compile(FILE, code).code)).toEqual([]);
  });

  // lightningcss throws a plain SyntaxError; the docs promise a CompileError.
  // 0.12.1 also rejects it ("Invalid media query"), so generators avoid it.
  it.fails('raises a CompileError for an interpolation in a @media query', () => {
    const code = `import { css } from 'solid-styled';\nexport function C(props: any) {\ncss\`@media (min-width: \${props.w}) { a { color: red; } }\`;\nreturn <a />;\n}\n`;
    expect(() => compile(FILE, code)).toThrow(CompileError);
  });
});
