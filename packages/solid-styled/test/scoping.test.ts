import { describe, expect, it } from 'vitest';
import { compile, SolidStyledOptions } from '../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe('scoping', () => {
  it('should scope for type selectors', async () => {
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
  it('should scope for class selectors', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    .example {
      color: red;
    }
  \`;

  return <h1 class="example">Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
  it('should scope for id selectors', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    #example {
      color: red;
    }
  \`;

  return <h1 id="example">Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
  it('should scope for attribute selectors', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    [id] {
      color: red;
    }
  \`;

  return <h1 id="example">Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
  it('should scope for universal selectors', async () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    * {
      color: red;
    }
  \`;

  return <h1>Hello World</h1>;
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
});
