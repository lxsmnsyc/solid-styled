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
