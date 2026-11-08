import { describe, expect, it } from 'vitest';
import type { SolidStyledOptions } from '../compiler';
import { compile } from '../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe('scoping', () => {
  it('should scope for type selectors', () => {
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
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should scope for class selectors', () => {
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
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should scope for id selectors', () => {
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
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should scope for attribute selectors', () => {
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
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should scope for universal selectors', () => {
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
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
  it('should scope for @keyframes', () => {
    const code = `
import { css } from 'solid-styled';

export default function Example() {
  css\`
    h1 {
      animation-name: spin;
    }

    h2 {
      animation: spin 1s;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  \`;

  return <h1>Hello World</h1>;
}
  `;
    expect(compile(FILE, code, options).code).toMatchSnapshot();
  });
});

const TEMPLATE = 'css`a{color:red}`';

/** Compiles `body` inside a component that imports `css` from solid-styled. */
function compileComponent(body: string): string {
  const code = `import { css } from 'solid-styled';\nexport function C() {\n${body}\nreturn <a />;\n}\n`;
  return compile('src/index.tsx', code, options).code;
}

function expectCompiled(body: string): void {
  expect(compileComponent(body), 'css template should be compiled').not.toContain(TEMPLATE);
}

function expectLeftAsIs(body: string): void {
  expect(compileComponent(body), 'css template should be left as is').toContain(TEMPLATE);
}

describe('css shadowed by a local binding (#50)', () => {
  it('compiles the css import when nothing shadows it', () => {
    expectCompiled(`${TEMPLATE};`);
  });

  it('leaves css alone after a var css in a nested block', () => {
    expectLeftAsIs(`if (globalThis.a) { var css = String.raw; }\n${TEMPLATE};`);
  });

  it('leaves css alone inside a switch case that declares let css', () => {
    expectLeftAsIs(`switch (globalThis.x) { case 0: let css = String.raw; ${TEMPLATE}; }`);
  });

  it('leaves css alone in another case of the same switch', () => {
    expectLeftAsIs(
      `switch (globalThis.x) { case 0: let css = String.raw; break; case 1: ${TEMPLATE}; }`,
    );
  });

  it('compiles css outside a switch that declares let css', () => {
    expectCompiled(`switch (globalThis.x) { case 0: let css = String.raw; }\n${TEMPLATE};`);
  });

  it('leaves css alone inside a class expression named css', () => {
    expectLeftAsIs(`const X = class css { m() { ${TEMPLATE}; } };`);
  });

  it('compiles css outside a class expression named css', () => {
    expectCompiled(`const X = class css {};\n${TEMPLATE};`);
  });

  it('leaves css alone after for (var css ...)', () => {
    expectLeftAsIs(`for (var css = String.raw; false; ) {}\n${TEMPLATE};`);
  });

  it('leaves css alone after for (var css of ...)', () => {
    expectLeftAsIs(`for (var css of [String.raw]) {}\n${TEMPLATE};`);
  });

  it('leaves css alone inside for (let css of ...)', () => {
    expectLeftAsIs(`for (let css of [String.raw]) { ${TEMPLATE}; }`);
  });

  it('compiles css after for (let css of ...)', () => {
    expectCompiled(`for (let css of [String.raw]) {}\n${TEMPLATE};`);
  });

  it('leaves css alone inside catch (css)', () => {
    expectLeftAsIs(`try {} catch (css) { ${TEMPLATE}; }`);
  });

  it('compiles css after catch (css)', () => {
    expectCompiled(`try {} catch (css) {}\n${TEMPLATE};`);
  });

  it('leaves css alone inside a function expression named css', () => {
    expectLeftAsIs(`const f = function css() { ${TEMPLATE}; };`);
  });

  it('compiles css next to a function expression named css', () => {
    expectCompiled(`const f = function css() {};\n${TEMPLATE};`);
  });

  it('leaves css alone after a destructured var { css } in a nested block', () => {
    expectLeftAsIs(`{ var { css } = { css: String.raw }; }\n${TEMPLATE};`);
  });

  it('leaves css alone after a var css in a labeled block', () => {
    expectLeftAsIs(`label: { var css = String.raw; }\n${TEMPLATE};`);
  });

  it('leaves css alone before a var css declared later in a nested block', () => {
    expectLeftAsIs(`${TEMPLATE};\nif (globalThis.a) { var css = String.raw; }`);
  });

  it('leaves css alone before a var css declared later in the same function', () => {
    expectLeftAsIs(`${TEMPLATE};\nvar css = String.raw;`);
  });

  it('leaves css alone after a module-level var css in a nested block', () => {
    const code = `import { css } from 'solid-styled';\nif (globalThis.a) { var css = String.raw; }\nexport function C() {\n${TEMPLATE};\nreturn <a />;\n}\n`;
    expect(compile('src/index.tsx', code, options).code).toContain(TEMPLATE);
  });

  it('compiles css in a sibling function of one that declares var css', () => {
    expectCompiled(`function a() { if (globalThis.a) { var css = String.raw; } }\n${TEMPLATE};`);
  });

  it('compiles css when a nested arrow function declares var css', () => {
    expectCompiled(`const g = () => { { var css = String.raw; } };\n${TEMPLATE};`);
  });

  it('compiles css when a class static block declares var css', () => {
    expectCompiled(`class K { static { { var css = String.raw; } } }\n${TEMPLATE};`);
  });
});
