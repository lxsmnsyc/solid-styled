import { describe, expect, it } from 'vitest';
import { compile, SolidStyledOptions } from '../../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe(':global > type selectors', () => {
  it('should scope for type selectors', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    :global(h1) {
      color: red;
    }
  \`;

  return <h1>Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
});
