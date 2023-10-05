import { describe, expect, it } from 'vitest';
import type { SolidStyledOptions } from '../compiler';
import { compile } from '../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe('jsx', () => {
  it('should transform', async () => {
    const code = `
export default function Example() {
  return (
    <>
      <style jsx>
        {\`
          h1 {
            color: red;
          }
        \`}
      </style>
      <h1>Hello World</h1>
    </>
  );
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
  it('should work with multiple templates', async () => {
    const code = `
export default function Example() {
  return (
    <>
      <style jsx>
        {\`
          h1 {
            color: red;
          }
        \`}
      </style>
      <h1>Hello World</h1>
      <style jsx>
        {\`
          h2 {
            color: blue;
          }
        \`}
      </style>
      <h2>Hello World</h2>
    </>
  );
}
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
  it('should transform dynamic templates', async () => {
    const code = `
    export default function Example() {
      return (
        <>
          <style jsx>
            {\`
              h1 {
                color: \${props.color};
              }
            \`}
          </style>
          <h1>Hello World</h1>
        </>
      );
    }
  `;
    expect((await compile(FILE, code, options)).code).toMatchSnapshot();
  });
});
