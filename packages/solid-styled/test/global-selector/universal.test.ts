import { describe, expect, it } from 'vitest';
import type { SolidStyledOptions } from '../../compiler';
import { compile } from '../../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe(':global > universal selectors', () => {
  it('should scope for universal selectors', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    :global(*) {
      color: red;
    }
  \`;

  return <h1>Hello World</h1>;
}
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
});
