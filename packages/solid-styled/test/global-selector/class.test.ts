import { describe, expect, it } from 'vitest';
import type { SolidStyledOptions } from '../../compiler';
import { compile } from '../../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe(':global > class selectors', () => {
  it('should scope for class selectors', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    :global(.example) {
      color: red;
    }
  \`;

  return <h1 class="example">Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
});
