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

describe('css shadowed by a local TypeScript declaration', () => {
  it('leaves css alone inside a function that declares enum css', () => {
    expectLeftAsIs(`enum css { A }\n${TEMPLATE};`);
  });

  it('leaves css alone before an enum css declared later in the function', () => {
    expectLeftAsIs(`${TEMPLATE};\nenum css { A }`);
  });

  it('leaves css alone inside a function that declares const enum css', () => {
    expectLeftAsIs(`const enum css { A }\n${TEMPLATE};`);
  });

  it('leaves css alone inside a block that declares enum css', () => {
    expectLeftAsIs(`if (globalThis.a) { enum css { A } ${TEMPLATE}; }`);
  });

  it('compiles css in a sibling function of one that declares enum css', () => {
    const code = `import { css } from 'solid-styled';\nfunction a() { enum css { A } }\nexport function C() {\n${TEMPLATE};\nreturn <a />;\n}\n`;
    expect(
      compile('src/index.tsx', code, options).code,
      'css template should be compiled',
    ).not.toContain(TEMPLATE);
  });

  it('compiles css outside the block that declares enum css', () => {
    expectCompiled(`if (globalThis.a) { enum css { A } }\n${TEMPLATE};`);
  });

  it('does not treat type css as a shadowing binding', () => {
    expectCompiled(`type css = string;\n${TEMPLATE};`);
  });

  it('does not treat interface css as a shadowing binding', () => {
    expectCompiled(`interface css {}\n${TEMPLATE};`);
  });
});

const IMPORT = `import { css } from 'solid-styled';\n`;

/** Compiles a whole `.tsx` file and reports whether the css template was rewritten. */
function isFileCompiled(code: string): boolean {
  return !compile('src/index.tsx', code, options).code.includes(TEMPLATE);
}

function namespaceBody(declaration: string): string {
  return `${IMPORT}namespace N { ${declaration} export function C() { ${TEMPLATE}; return <h1 />; } }\n`;
}

describe('css shadowed inside a TypeScript namespace', () => {
  const declarations = [
    'const css = (x: any) => x;',
    'let css = (x: any) => x;',
    'var css = (x: any) => x;',
    'function css(x?: any) {}',
    'enum css { A }',
    'class css {}',
    'import css = M.x;',
    'export const css = (x: any) => x;',
  ];
  for (const declaration of declarations) {
    it(`leaves css alone with ${declaration}`, () => {
      expect(isFileCompiled(namespaceBody(declaration))).toBe(false);
    });
  }

  it('leaves css alone in a dotted namespace', () => {
    const code = `${IMPORT}namespace N.M { const css = (x: any) => x; export function C() { ${TEMPLATE}; return <h1 />; } }\n`;
    expect(isFileCompiled(code)).toBe(false);
  });

  it('leaves css alone in an exported namespace', () => {
    const code = `${IMPORT}export namespace N { const css = (x: any) => x; export function C() { ${TEMPLATE}; return <h1 />; } }\n`;
    expect(isFileCompiled(code)).toBe(false);
  });

  it('leaves s.css alone when a local s shadows import * as s', () => {
    const code = `import * as s from 'solid-styled';\nnamespace N { const s = { css: (x: any) => x }; export function C() { s.${TEMPLATE}; return <h1 />; } }\n`;
    expect(compile('src/index.tsx', code, options).code).toContain(`s.${TEMPLATE}`);
  });

  it('compiles css outside the namespace', () => {
    const code = `${IMPORT}namespace N { var css = (x: any) => x; }\nexport function C() { ${TEMPLATE}; return <h1 />; }\n`;
    expect(isFileCompiled(code)).toBe(true);
  });

  it('compiles css in a sibling namespace', () => {
    const code = `${IMPORT}namespace N { const css = (x: any) => x; }\nnamespace M { export function C() { ${TEMPLATE}; return <h1 />; } }\n`;
    expect(isFileCompiled(code)).toBe(true);
  });

  it('compiles css in a namespace that does not declare it', () => {
    const code = `${IMPORT}namespace N { export function C() { ${TEMPLATE}; return <h1 />; } }\n`;
    expect(isFileCompiled(code)).toBe(true);
  });

  it('does not treat a type-only import equals as a binding', () => {
    const code = `${IMPORT}import type css = require('m');\nexport function C() { ${TEMPLATE}; return <h1 />; }\n`;
    expect(isFileCompiled(code)).toBe(true);
  });
});

describe('css shadowed by a TypeScript parameter property', () => {
  const properties = ['private css: any', 'public readonly css: any', 'private css = 1'];
  for (const property of properties) {
    it(`leaves css alone with constructor(${property})`, () => {
      const code = `${IMPORT}class A { constructor(${property}) { ${TEMPLATE}; } }\n`;
      expect(isFileCompiled(code)).toBe(false);
    });
  }

  it('compiles css in another method of the class', () => {
    const code = `${IMPORT}class A { constructor(private css: any) {} m() { ${TEMPLATE}; return <h1 />; } }\n`;
    expect(isFileCompiled(code)).toBe(true);
  });
});
