import { describe, expect, it } from 'vitest';
import type { SolidStyledOptions } from '../../compiler';
import { compile } from '../../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe(':global', () => {
  it('should scope for nested selectors', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    div {
      display: flex;
      flex-direction: column;
    
      > :global(* + *) {
        margin-top: 0.5rem;
      }
    }
  \`;

  return <h1>Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
});
