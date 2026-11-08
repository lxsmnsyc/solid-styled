import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';
import { compile } from '../compiler';
import { spreadStyle } from '../src/core';
import { FILE, options, transform } from './util';

describe('element scoping', () => {
  it('should scope host elements only', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return (
    <div>
      <h1>Hello World</h1>
      <Custom />
    </div>
  );
}
`;
    const result = transform(code);
    expect(result).toMatch(/<div s:c-[0-9a-f]+-0>/);
    expect(result).toMatch(/<h1 s:c-[0-9a-f]+-0>/);
    expect(result).toContain('<Custom />');
  });

  it('should scope a component opted in with `use:solid-styled`', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return <Custom use:solid-styled />;
}
`;
    const result = transform(code);
    expect(result).toMatch(/<Custom s:c-[0-9a-f]+-0 \/>/);
    expect(result).not.toContain('use:solid-styled');
  });

  it('should strip `use:solid-styled` even without a sheet', () => {
    const code = `
export default function Example() {
  return <Custom use:solid-styled />;
}
`;
    expect(transform(code)).not.toContain('use:solid-styled');
  });

  it('should not scope member expression elements', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return <Foo.Bar />;
}
`;
    expect(transform(code)).toContain('<Foo.Bar />');
  });

  it('should not duplicate a scope marker the author already wrote', () => {
    const template = (marker: string): string => `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return <h1${marker}>Hello World</h1>;
}
`;
    const scope = /s:(c-[0-9a-f]+-0)/.exec(transform(template('')))?.[1];
    expect(scope).toBeDefined();

    const result = transform(template(` s:${scope}`));
    expect(result.split(`<h1 s:${scope}>`)).toHaveLength(2);
    expect(result).not.toContain(`s:${scope} s:${scope}`);
  });

  it('should scope the JSX of a nested function with the outer sheet', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  const render = () => <h1>Hello World</h1>;
  return <div>{render()}</div>;
}
`;
    const result = transform(code);
    const scope = /s:(c-[0-9a-f]+-0)/.exec(result)?.[1];
    expect(result.split(`s:${scope}`)).toHaveLength(3);
  });

  it('should give each component its own sheet', () => {
    const code = `
import { css } from 'solid-styled';

export function A() {
  css\`h1 { color: red; }\`;
  return <h1>A</h1>;
}

export function B() {
  css\`h1 { color: blue; }\`;
  return <h1>B</h1>;
}
`;
    const result = transform(code);
    expect(result).toContain('const sheet_1 =');
    expect(result).toContain('const sheet_2 =');
    expect(result).toMatch(/const sheet_1 = "c-[0-9a-f]+-0"/);
    expect(result).toMatch(/const sheet_2 = "c-[0-9a-f]+-1"/);
  });
});

describe('style merging', () => {
  // oxlint-disable-next-line no-template-curly-in-string
  const SHEET = 'css`h1 { color: ${props.color}; }`;';

  it('should add a style prop when the element has none', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(props) {
  ${SHEET}
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code)).toContain('style={vars_1()}');
  });

  it('should merge into an existing expression', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(props) {
  ${SHEET}
  return <h1 style={{ color: 'blue' }}>Hello World</h1>;
}
`;
    expect(transform(code)).toContain("style={_mergeStyles({ color: 'blue' }, vars_1())}");
  });

  it('should merge into a string literal', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(props) {
  ${SHEET}
  return <h1 style="color: blue">Hello World</h1>;
}
`;
    expect(transform(code)).toContain('style={_mergeStyles("color: blue", vars_1())}');
  });

  it('should fill in a valueless style prop', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(props) {
  ${SHEET}
  return <h1 style>Hello World</h1>;
}
`;
    expect(transform(code)).toContain('style={vars_1()}');
  });

  it('should nest merges for nested sheets', () => {
    const code = `
import { css } from 'solid-styled';

export default function Outer(props) {
  ${SHEET}
  function Inner(props) {
    ${SHEET}
    return <h1 style={base}>Hello World</h1>;
  }
  return <Inner />;
}
`;
    expect(transform(code)).toContain('_mergeStyles(_mergeStyles(base, vars_1()), vars_2())');
  });
});

describe('spread attributes', () => {
  // oxlint-disable-next-line no-template-curly-in-string
  const DYNAMIC = 'css`button { color: ${props.color}; }`;';
  const STATIC = 'css`button { color: red; }`;';

  /** Wraps a return value in a component that owns the given sheet. */
  function wrapComponent(body: string, sheet = DYNAMIC, head = 'function Button(props)'): string {
    return `
import { css } from 'solid-styled';

export ${head} {
  ${sheet}
  return ${body};
}
`;
  }

  /** Compiles, checks the output parses, and writes `S` in place of the scope. */
  function compileSpread(code: string): string {
    const result = transform(code);
    const parsed = parseSync('index.tsx', result, { lang: 'tsx' });
    expect(parsed.errors).toEqual([]);
    const scope = /s:(c-[0-9a-f]+-0)/.exec(result)?.[1];
    expect(scope).toBeDefined();
    return result.replaceAll(`s:${scope!}`, 's:S');
  }

  it('should merge the style of a single spread', () => {
    const result = compileSpread(wrapComponent('<button {...props} />'));
    expect(result).toContain('<button style={vars_1()} {..._spreadStyle(props, vars_1)} s:S />');
  });

  it('should merge an explicit style that follows the spread', () => {
    const result = compileSpread(wrapComponent('<button {...props} style={x} />'));
    expect(result).toContain('<button {...props} s:S style={_mergeStyles(x, vars_1())} />');
    expect(result).not.toContain('_spreadStyle');
  });

  it('should merge an explicit style before the spread in place', () => {
    const result = compileSpread(wrapComponent('<button style={x} {...props} />'));
    expect(result).toContain(
      '<button style={_mergeStyles(x, vars_1())} {..._spreadStyle(props, vars_1)} s:S />',
    );
  });

  it('should merge a string style before the spread in place', () => {
    const result = compileSpread(wrapComponent('<button style="color: blue" {...props} />'));
    expect(result).toContain(
      '<button style={_mergeStyles("color: blue", vars_1())} {..._spreadStyle(props, vars_1)} s:S />',
    );
  });

  it('should wrap every spread', () => {
    const result = compileSpread(wrapComponent('<button {...a} {...props.rest} title="t" />'));
    expect(result).toContain(
      '<button style={vars_1()} {..._spreadStyle(a, vars_1)} {..._spreadStyle(props.rest, vars_1)} s:S title="t" />',
    );
  });

  it('should leave spreads before the last explicit style alone', () => {
    const result = compileSpread(wrapComponent('<button {...a} style={x} {...b} />'));
    expect(result).toContain(
      '<button {...a} style={_mergeStyles(x, vars_1())} {..._spreadStyle(b, vars_1)} s:S />',
    );
  });

  it('should merge into the last of several explicit styles', () => {
    const result = compileSpread(wrapComponent('<div style={a} style={b} />'));
    expect(result).toContain('<div s:S style={a} style={_mergeStyles(b, vars_1())} />');
  });

  it('should pass every sheet of nested components', () => {
    const code = `
import { css } from 'solid-styled';

export function Outer(props) {
  ${DYNAMIC}
  function Inner(props) {
    ${DYNAMIC}
    return <button style={x} {...props} />;
  }
  return <Inner />;
}
`;
    const result = transform(code);
    expect(result).toContain(
      'style={_mergeStyles(_mergeStyles(x, vars_1()), vars_2())} {..._spreadStyle(props, vars_1, vars_2)}',
    );
  });

  it('should evaluate a spread call once, in place', () => {
    const result = compileSpread(wrapComponent('<button {...getProps()} />'));
    expect(result.split('getProps()')).toHaveLength(2);
    expect(result).toContain(
      'return <button style={vars_1()} {..._spreadStyle(getProps(), vars_1)} s:S />;',
    );
  });

  it('should keep a spread element inside its parent template', () => {
    const result = compileSpread(wrapComponent('<div><button {...getProps()} /></div>'));
    expect(result).toContain(
      'return <div s:S style={vars_1()}><button style={vars_1()} {..._spreadStyle(getProps(), vars_1)} s:S /></div>;',
    );
  });

  it('should place the scope after the spread for a static sheet', () => {
    const result = compileSpread(wrapComponent('<button {...getProps()} />', STATIC));
    expect(result).toContain('<button {...getProps()} s:S />');
    expect(result).not.toContain('style=');
    expect(result).not.toContain('_spreadStyle');
  });

  it('should apply the same rules to `use:solid-styled`', () => {
    const result = compileSpread(wrapComponent('<Custom style={x} {...props} use:solid-styled />'));
    expect(result).toContain(
      '<Custom style={_mergeStyles(x, vars_1())} {..._spreadStyle(props, vars_1)} s:S />',
    );
  });

  it('should apply the same rules to elements scoped by `<style jsx>`', () => {
    const code = `
export function Button(props) {
  return (
    <>
      <style jsx>{\`button { color: \${props.color}; }\`}</style>
      <button {...props} />
    </>
  );
}
`;
    const result = compileSpread(code);
    expect(result).toContain('<button style={vars_1()} {..._spreadStyle(props, vars_1)} s:S />');
  });

  // The review of #71 found these cases broke when the spread was copied
  // into `_trackSpread(() => ...)` and the explicit style moved.
  it('should keep object literal and sequence spreads', () => {
    const literal = compileSpread(wrapComponent("<div {...{ id: 'x', title: 'y' }} />"));
    expect(literal).toContain("{..._spreadStyle({ id: 'x', title: 'y' }, vars_1)}");

    const sequence = compileSpread(wrapComponent('<div {...(a, b)} />'));
    expect(sequence).toContain('{...(_spreadStyle((a, b), vars_1))}');
  });

  it('should scope JSX inside a spread argument', () => {
    const conditional = compileSpread(
      wrapComponent('<div {...(props.x ? { children: <b /> } : {})} />'),
    );
    expect(conditional).toContain(
      '{...(_spreadStyle(props.x ? { children: <b s:S style={vars_1()} /> } : {}, vars_1))}',
    );

    const component = compileSpread(
      wrapComponent(
        '<Show {...merge(props, { get fallback() { return <i />; } })} use:solid-styled />',
      ),
    );
    expect(component).toContain(
      '<Show style={vars_1()} {..._spreadStyle(merge(props, { get fallback() { return <i s:S style={vars_1()} />; } }), vars_1)} s:S />',
    );
  });

  it('should keep an SVG child in its parent template', () => {
    const result = compileSpread(wrapComponent('<svg><a {...getP()} href="#x" /></svg>'));
    expect(result).toContain(
      'return <svg s:S style={vars_1()}><a style={vars_1()} {..._spreadStyle(getP(), vars_1)} s:S href="#x" /></svg>;',
    );
  });

  it('should keep `await` and `yield` in their function', () => {
    const awaited = compileSpread(
      wrapComponent('<div {...await props.p} />', DYNAMIC, 'async function Button(props)'),
    );
    expect(awaited).toContain('{..._spreadStyle(await props.p, vars_1)}');

    const yielded = compileSpread(
      wrapComponent('<div {...(yield props.p)} />', DYNAMIC, 'function* Button(props)'),
    );
    expect(yielded).toContain('{...(_spreadStyle(yield props.p, vars_1))}');
  });

  it('should scope JSX inside an explicit style before a spread', () => {
    const plain = compileSpread(wrapComponent('<div style={f(<i />)} {...props} />'));
    expect(plain).toContain(
      '<div style={_mergeStyles(f(<i s:S style={vars_1()} />), vars_1())} {..._spreadStyle(props, vars_1)} s:S />',
    );

    const spread = compileSpread(wrapComponent('<div style={f(<i {...g()} />)} {...p()} />'));
    expect(spread).toContain(
      '<div style={_mergeStyles(f(<i style={vars_1()} {..._spreadStyle(g(), vars_1)} s:S />), vars_1())} {..._spreadStyle(p(), vars_1)} s:S />',
    );
  });

  it('should map a token inside the spread to its original column', () => {
    const code = wrapComponent('<button {...getProps(token)} />');
    const { code: output, map } = compile(FILE, code, options);
    const original = locate(code, 'token');
    const generated = locate(output, 'token');
    expect(generated.column).not.toBe(original.column);
    expect(findOriginal(map.mappings, generated)).toEqual({
      line: original.line,
      column: original.column,
    });
  });
});

describe('spreadStyle', () => {
  function vars(): Record<string, string> {
    return { '--v': 'red' };
  }

  it('should return a source without a style key as is', () => {
    const source = { id: 'x' };
    expect(spreadStyle(source, vars)).toBe(source);
    expect(spreadStyle(null, vars)).toBeNull();
    expect(spreadStyle(undefined, vars)).toBeUndefined();
  });

  it('should merge the variables into a style key', () => {
    expect(spreadStyle({ id: 'x', style: 'top: 1px' }, vars)).toEqual({
      id: 'x',
      style: 'top: 1px;--v:red;',
    });
    expect(spreadStyle({ style: { top: '2px' } }, vars)).toHaveProperty(
      'style',
      'top:2px;;--v:red;',
    );
    // A style key without a value still wins, as in Solid.
    expect(spreadStyle({ style: undefined }, vars)).toHaveProperty('style', '--v:red;');
  });

  it('should read the source style on each access', () => {
    let style = 'top: 1px';
    const source = {
      get style() {
        return style;
      },
    };
    const merged = spreadStyle(source, vars);
    expect(merged).toHaveProperty('style', 'top: 1px;--v:red;');
    style = 'top: 2px';
    expect(merged).toHaveProperty('style', 'top: 2px;--v:red;');
  });

  it('should merge every sheet in order', () => {
    function inner(): Record<string, string> {
      return { '--w': 'blue' };
    }
    expect(spreadStyle({ style: 'a: b' }, vars, inner)).toHaveProperty(
      'style',
      'a: b;--v:red;;--w:blue;',
    );
  });
});

interface Position {
  line: number;
  column: number;
}

/** Zero-based line and column of the first `needle` in `code`. */
function locate(code: string, needle: string): Position {
  const lines = code.slice(0, code.indexOf(needle)).split('\n');
  return { line: lines.length - 1, column: lines[lines.length - 1].length };
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes one line of a source map's VLQ mappings into number groups. */
function decodeLine(line: string): number[][] {
  const segments: number[][] = [];
  for (const segment of line.split(',')) {
    const values: number[] = [];
    let value = 0;
    let shift = 0;
    for (const char of segment) {
      const digit = BASE64.indexOf(char);
      value += (digit & 31) << shift;
      if (digit & 32) {
        shift += 5;
      } else {
        values.push(value & 1 ? -(value >>> 1) : value >>> 1);
        value = 0;
        shift = 0;
      }
    }
    segments.push(values);
  }
  return segments;
}

/** The original position a generated position maps to. */
function findOriginal(mappings: string, generated: Position): Position | undefined {
  let line = 0;
  let column = 0;
  for (const [index, text] of mappings.split(';').entries()) {
    let generatedColumn = 0;
    for (const segment of decodeLine(text)) {
      if (segment.length < 4) {
        continue;
      }
      generatedColumn += segment[0];
      line += segment[2];
      column += segment[3];
      if (index === generated.line && generatedColumn === generated.column) {
        return { line, column };
      }
    }
  }
  return undefined;
}
