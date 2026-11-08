import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vitest';
import { transform } from './util';

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
  function wrapComponent(body: string, sheet = DYNAMIC): string {
    return `
import { css } from 'solid-styled';

export function Button(props) {
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
    expect(result).toContain(
      '<button {...props} s:S style={_mergeStyles(props.style, vars_1())} />',
    );
  });

  it('should merge an explicit style that follows the spread', () => {
    const result = compileSpread(wrapComponent('<button {...props} style={x} />'));
    expect(result).toContain('<button {...props} s:S style={_mergeStyles(x, vars_1())} />');
  });

  it('should prefer the spread style over an explicit style before it', () => {
    const result = compileSpread(wrapComponent('<button style={x} {...props} />'));
    expect(result).toContain(
      '<button {...props} s:S style={_mergeStyles(("style" in props ? props.style : x), vars_1())} />',
    );
  });

  it('should take a string style before the spread as the fallback', () => {
    const result = compileSpread(wrapComponent('<button style="color: blue" {...props} />'));
    expect(result).toContain(
      '<button {...props} s:S style={_mergeStyles(("style" in props ? props.style : "color: blue"), vars_1())} />',
    );
  });

  it('should resolve the style across several spreads', () => {
    const result = compileSpread(wrapComponent('<button {...a} {...props.rest} title="t" />'));
    expect(result).toContain(
      '<button {...a} {...props.rest} s:S style={_mergeStyles(("style" in props.rest ? props.rest.style : a.style), vars_1())} title="t" />',
    );
  });

  it('should ignore spreads before the last explicit style', () => {
    const result = compileSpread(wrapComponent('<button {...a} style={x} {...b} />'));
    expect(result).toContain(
      '<button {...a} {...b} s:S style={_mergeStyles(("style" in b ? b.style : x), vars_1())} />',
    );
  });

  it('should evaluate a spread call once and keep it reactive', () => {
    const result = compileSpread(wrapComponent('<button {...getProps()} />'));
    expect(result.split('getProps()')).toHaveLength(2);
    expect(result).toContain(
      'return ((_spread_1) => <button {..._spread_1()} s:S style={_mergeStyles(_spread_1().style, vars_1())} />)(_trackSpread(() => getProps()));',
    );
  });

  it('should bind every spread call the style reads', () => {
    const result = compileSpread(wrapComponent('<button {...getA()} title="t" {...getB()} />'));
    expect(result.split('getA()')).toHaveLength(2);
    expect(result.split('getB()')).toHaveLength(2);
    expect(result).toContain(
      '((_spread_1, _spread_2) => <button {..._spread_1()} title="t" {..._spread_2()} s:S style={_mergeStyles(("style" in _spread_2() ? _spread_2().style : _spread_1().style), vars_1())} />)(_trackSpread(() => getA()), _trackSpread(() => getB()))',
    );
  });

  it('should wrap a bound element in braces when it is a JSX child', () => {
    const result = compileSpread(wrapComponent('<div><button {...getProps()} /></div>'));
    expect(result).toContain('<div s:S style={vars_1()}>{((_spread_1) => <button');
    expect(result).toContain('(_trackSpread(() => getProps()))}</div>');
  });

  it('should place the scope after the spread for a static sheet', () => {
    const result = compileSpread(wrapComponent('<button {...getProps()} />', STATIC));
    expect(result).toContain('<button {...getProps()} s:S />');
    expect(result).not.toContain('style=');
  });

  it('should apply the same rules to `use:solid-styled`', () => {
    const result = compileSpread(wrapComponent('<Custom style={x} {...props} use:solid-styled />'));
    expect(result).toContain(
      '<Custom {...props} s:S style={_mergeStyles(("style" in props ? props.style : x), vars_1())} />',
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
    expect(result).toContain(
      '<button {...props} s:S style={_mergeStyles(props.style, vars_1())} />',
    );
  });
});
