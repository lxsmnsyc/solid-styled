import { describe, expect, it } from 'vitest';
import { transform } from './util';

describe('css tag resolution', () => {
  it('should transform a named import', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    const result = transform(code);
    expect(result).toContain('useSolidStyled');
    expect(result).toMatchSnapshot();
  });

  it('should transform an aliased import', () => {
    const code = `
import { css as styled } from 'solid-styled';

export default function Example() {
  styled\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    const result = transform(code);
    expect(result).toContain('useSolidStyled');
    expect(result).toMatchSnapshot();
  });

  it('should transform a namespace import', () => {
    const code = `
import * as styled from 'solid-styled';

export default function Example() {
  styled.css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    const result = transform(code);
    expect(result).toContain('useSolidStyled');
    expect(result).toMatchSnapshot();
  });

  it('should ignore a css tag that was never imported', () => {
    const code = `
export default function Example() {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code)).toBe(code);
  });

  it('should ignore a css tag imported from another module', () => {
    const code = `
import { css } from 'other-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code)).toBe(code);
  });

  it('should ignore a css tag shadowed by a local binding', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  const css = String.raw;
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code)).toBe(code);
  });

  it('should ignore a css tag shadowed by a parameter', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(css) {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code)).toBe(code);
  });

  it('should ignore a css call that is not a statement', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  const sheet = css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code)).toBe(code);
  });

  it('should ignore a css tag outside of a component', () => {
    const code = `
import { css } from 'solid-styled';

css\`h1 { color: red; }\`;
`;
    expect(transform(code)).toBe(code);
  });
});
