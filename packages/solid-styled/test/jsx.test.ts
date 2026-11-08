import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';
import type { SolidStyledOptions } from '../compiler';
import { CompileError, compile } from '../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe('jsx', () => {
  it('should transform', () => {
    const code = `
export default function Example() {
  return (
    <>
      <style jsx>
        {\`
          h1 {
            color: red;
          }
        \`}
      </style>
      <h1>Hello World</h1>
    </>
  );
}
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should work with multiple templates', () => {
    const code = `
export default function Example() {
  return (
    <>
      <style jsx>
        {\`
          h1 {
            color: red;
          }
        \`}
      </style>
      <h1>Hello World</h1>
      <style jsx>
        {\`
          h2 {
            color: blue;
          }
        \`}
      </style>
      <h2>Hello World</h2>
    </>
  );
}
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should transform dynamic templates', () => {
    const code = `
    export default function Example() {
      return (
        <>
          <style jsx>
            {\`
              h1 {
                color: \${props.color};
              }
            \`}
          </style>
          <h1>Hello World</h1>
        </>
      );
    }
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
});
describe('jsx.global', () => {
  it('should transform', () => {
    const code = `
export default function Example() {
  return (
    <>
      <style jsx global>
        {\`
          h1 {
            color: red;
          }
        \`}
      </style>
      <h1>Hello World</h1>
    </>
  );
}
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should work with multiple templates', () => {
    const code = `
export default function Example() {
  return (
    <>
      <style jsx global>
        {\`
          h1 {
            color: red;
          }
        \`}
      </style>
      <h1>Hello World</h1>
      <style jsx global>
        {\`
          h2 {
            color: blue;
          }
        \`}
      </style>
      <h2>Hello World</h2>
    </>
  );
}
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should transform dynamic templates', () => {
    const code = `
    export default function Example() {
      return (
        <>
          <style jsx global>
            {\`
              h1 {
                color: \${props.color};
              }
            \`}
          </style>
          <h1>Hello World</h1>
        </>
      );
    }
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
});

describe('jsx in exported expression-body components', () => {
  const STYLE = '<style jsx>{`a { color: red; }`}</style>';

  /** Compiles a snippet, checks it parses, and returns the output. */
  function compileValid(code: string): string {
    const output = compile('src/index.tsx', code, options).code;
    const parsed = parseSync('index.tsx', output, { lang: 'tsx' });
    expect(parsed.errors).toEqual([]);
    return output;
  }

  /** Checks the setup call comes before the given statement. */
  function expectCallBefore(output: string, statement: string, callee = '_useSolidStyled('): void {
    const call = output.indexOf(callee);
    expect(call).toBeGreaterThanOrEqual(0);
    expect(output.indexOf(statement)).toBeGreaterThan(call);
  }

  it('should place the call before `export const`', () => {
    const output = compileValid(`export const C = () => <div>${STYLE}</div>;`);
    expectCallBefore(output, 'export const C = () =>');
  });
  it('should place the call before `export const` with a parenthesized body', () => {
    const output = compileValid(`export const C = () => (\n  <div>${STYLE}</div>\n);`);
    expectCallBefore(output, 'export const C = () =>');
  });
  it('should place the call before `export default`', () => {
    const output = compileValid(`export default () => <div>${STYLE}</div>;`);
    expectCallBefore(output, 'export default () =>');
  });
  it('should place the call before a non-exported `const`', () => {
    const output = compileValid(`const C = () => <div>${STYLE}</div>;`);
    expectCallBefore(output, 'const C = () =>');
  });
  it('should place the call before `export class`', () => {
    const output = compileValid(`export class K { r = () => <div>${STYLE}</div>; }`);
    expectCallBefore(output, 'export class K');
  });
  it('should place the call before `export default class`', () => {
    const output = compileValid(`export default class { r = () => <div>${STYLE}</div>; }`);
    expectCallBefore(output, 'export default class');
  });
  it('should place the global call before `export const`', () => {
    const output = compileValid(
      'export const C = () => <div><style jsx global>{`a { color: red; }`}</style></div>;',
    );
    expectCallBefore(output, 'export const C = () =>', '_useSolidStyledGlobal(');
  });
  it('should keep the call inside a nested function, before its statement', () => {
    const output = compileValid(
      `export function outer() { const C = () => <div>${STYLE}</div>; return C; }`,
    );
    expectCallBefore(output, 'const C = () =>');
    expectCallBefore(output, '_useSolidStyled(', 'export function outer');
  });
  it('should still reject dynamic styles in an exported expression body', () => {
    expect(() =>
      compile(
        'src/index.tsx',
        `export const C = () => <div><style jsx>{\`a { color: \${x}; }\`}</style></div>;`,
        options,
      ),
    ).toThrow(CompileError);
  });
});
