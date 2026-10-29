import { describe, expect, it } from 'vitest';
import { compile } from '../compiler';
import { FILE, transform } from './util';

const SHEET = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;

describe('options', () => {
  it('should use the `c-` prefix by default', () => {
    expect(transform(SHEET)).toMatch(/const sheet_1 = "c-[0-9a-f]+-0"/);
  });

  it('should honour a custom prefix', () => {
    const result = transform(SHEET, { prefix: 'app' });
    expect(result).toMatch(/const sheet_1 = "app-[0-9a-f]+-0"/);
    expect(result).not.toContain('"c-');
  });

  it('should name the scope after the component when verbose', () => {
    const result = transform(SHEET, { verbose: true });
    expect(result).toMatch(/const sheet_1 = "c-Example-[0-9a-f]+-0"/);
  });

  it('should fall back to `Anonymous` for unnameable components', () => {
    const code = `
import { css } from 'solid-styled';

export default (() => {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
})();
`;
    expect(transform(code, { verbose: true })).toContain('c-Anonymous-');
  });

  it('should name the scope after the enclosing variable when verbose', () => {
    const code = `
import { css } from 'solid-styled';

const Example = () => {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
};
`;
    expect(transform(code, { verbose: true })).toContain('c-Example-');
  });

  it('should use the custom prefix for dynamic variables', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(props) {
  css\`h1 { color: \${props.color}; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code, { prefix: 'app' })).toMatch(/--s-app-[0-9a-f]+-1/);
  });

  it('should lower syntax according to the browserslist query', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { inset: 0; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code, { browserslist: 'chrome 60' })).toContain('top:0');
    expect(transform(code, { browserslist: 'chrome 130' })).toContain('inset:0');
  });

  it('should derive the scope hash from the file id', () => {
    const a = compile('src/a.tsx', SHEET, {}).code;
    const b = compile('src/b.tsx', SHEET, {}).code;
    expect(a).not.toBe(b);
    expect(compile(FILE, SHEET, {}).code).toBe(transform(SHEET));
  });
});
