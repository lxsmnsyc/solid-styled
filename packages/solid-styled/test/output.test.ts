import { describe, expect, it } from 'vitest';
import { CompileError, compile } from '../compiler';
import { FILE, transform } from './util';

const SHEET = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;

  // A comment that must survive the transform.
  const greeting = 'Hello World';

  return <h1>{greeting}</h1>;
}
`;

describe('output', () => {
  it('should leave untouched code byte for byte', () => {
    const result = transform(SHEET);
    expect(result).toContain('// A comment that must survive the transform.');
    expect(result).toContain("const greeting = 'Hello World';");
  });

  it('should return a source map', () => {
    const { map } = compile(FILE, SHEET, {});
    expect(map.version).toBe(3);
    expect(map.sources).toContain(FILE);
    expect(map.mappings.length).toBeGreaterThan(0);
  });

  it('should leave files without solid-styled alone', () => {
    const code = `
export default function Example() {
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code)).toBe(code);
  });

  it('should compile TypeScript syntax', () => {
    const code = `
import { css } from 'solid-styled';

interface Props {
  color: string;
}

export default function Example(props: Props) {
  css\`h1 { color: \${props.color satisfies string}; }\`;
  return <h1>Hello World</h1>;
}
`;
    const result = transform(code, {}, 'src/index.tsx');
    expect(result).toContain('interface Props');
    expect(result).toContain('props.color satisfies string');
  });

  it('should compile plain JSX files', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { color: red; }\`;
  return <h1>Hello World</h1>;
}
`;
    expect(transform(code, {}, 'src/index.jsx')).toContain('useSolidStyled');
  });

  it('should ignore a query suffix on the file id', () => {
    const plain = compile('src/index.tsx', SHEET, {}).code;
    const queried = compile('src/index.tsx?raw', SHEET, {}).code;
    expect(queried).toBe(plain);
  });

  it('should raise a located CompileError on a syntax error', () => {
    expect(() => transform('const = ;')).toThrow(CompileError);
    try {
      transform('const = ;');
    } catch (error) {
      expect((error as CompileError).line).toBe(1);
    }
  });

  it('should raise a CompileError for a concise arrow body', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(props) {
  const Inner = () => <style jsx>{\`h1 { color: \${props.color}; }\`}</style>;
  return <Inner />;
}
`;
    expect(() => transform(code)).toThrow(/block body/);
  });
});
