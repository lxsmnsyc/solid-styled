import { describe, expect, it } from 'vitest';
import { compile, SolidStyledOptions } from '../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe('css', () => {
  it('should transform', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    h1 {
      color: red;
    }
  \`;

  return <h1>Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
  it('should work with multiple templates', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    h1 {
      color: red;
    }
  \`;
  css\`
    h2 {
      color: blue;
    }
  \`;

  return (
    <>
      <h1>Hello World</h1>
      <h2>Hello World</h2>
    </>
  );
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
  it('should transform dynamic templates', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example(props) {
  css\`
    h1 {
      color: \${props.color};
    }
  \`;

  return <h1>Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
});
