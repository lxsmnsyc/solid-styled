import fc from 'fast-check';
import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';
import { compile } from '../compiler';
import { COMPILED_CALL, CONTROL_KINDS, SHADOW_KINDS, component, cssTemplate } from './arbitraries';

const FILE = 'src/index.tsx';

// Set FC_RUNS and FC_SEED to search wider than the default run.
const RUNS = Number(process.env.FC_RUNS ?? 150);
const params: fc.Parameters<unknown> = {
  seed: Number(process.env.FC_SEED ?? 20261108),
  numRuns: RUNS,
};

function countCompiled(code: string): number {
  return code.match(COMPILED_CALL)?.length ?? 0;
}

describe('cssTemplate', () => {
  it('lists every interpolation in source order', () => {
    fc.assert(
      fc.property(cssTemplate(), ({ source, vars }) => {
        const found = [...source.matchAll(/\$\{([^}]*)\}/g)].map((match) => match[1]);
        expect(found).toEqual(vars);
      }),
      params,
    );
  });
});

describe('component', () => {
  it('parses with oxc-parser', () => {
    fc.assert(
      fc.property(component(), ({ code }) => {
        const result = parseSync(FILE, code);
        expect(result.errors.map((error) => error.message)).toEqual([]);
      }),
      params,
    );
  });

  it('compiles, and the compiled count matches the expected count', () => {
    fc.assert(
      fc.property(component(), (module) => {
        const { code } = compile(FILE, module.code, { verbose: false });
        expect(module.expectedCompiled).toBe(module.expectedCss + module.expectedStyle);
        expect(countCompiled(code)).toBe(module.expectedCompiled);
      }),
      params,
    );
  });

  it('leaves untouched templates as tagged templates', () => {
    fc.assert(
      fc.property(component(), (module) => {
        const { code } = compile(FILE, module.code, { verbose: false });
        const tag = module.importForm === 'namespace' ? 's.css' : module.local;
        const remaining = code.split(`${tag}\``).length - 1;
        expect(remaining).toBe(module.expectedUntouched);
      }),
      params,
    );
  });

  it('emits output that parses with oxc-parser', () => {
    fc.assert(
      fc.property(component(), (module) => {
        const first = compile(FILE, module.code, { verbose: false }).code;
        const parsed = parseSync(FILE, first);
        expect(parsed.errors.map((error) => error.message)).toEqual([]);
      }),
      params,
    );
  });

  it('compiles with verbose names', () => {
    fc.assert(
      fc.property(component(), (module) => {
        const { code } = compile(FILE, module.code, { verbose: true });
        expect(countCompiled(code)).toBe(module.expectedCompiled);
      }),
      { ...params, numRuns: Math.min(RUNS, 40) },
    );
  });

  it('exercises every shadow kind and every control kind', () => {
    for (const shadow of SHADOW_KINDS) {
      fc.assert(
        fc.property(
          component({
            imports: ['named', 'aliased', 'namespace'],
            shadows: [shadow],
            controls: [],
          }),
          (module) => {
            const { code } = compile(FILE, module.code, { verbose: false });
            expect(countCompiled(code), shadow).toBe(module.expectedCompiled);
          },
        ),
        { ...params, numRuns: Math.min(RUNS, 12) },
      );
    }
    for (const control of CONTROL_KINDS) {
      fc.assert(
        fc.property(
          component({
            imports: ['named', 'aliased', 'namespace'],
            shadows: [],
            controls: [control],
          }),
          (module) => {
            const { code } = compile(FILE, module.code, { verbose: false });
            expect(countCompiled(code), control).toBe(module.expectedCompiled);
          },
        ),
        { ...params, numRuns: Math.min(RUNS, 12) },
      );
    }
  });
});
