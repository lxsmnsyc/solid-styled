import { describe, expect, it } from 'vitest';
import { transform } from './util';

function sheetOf(code: string): string {
  const match = /const css_1 = "((?:[^"\\]|\\.)*)"/.exec(transform(code));
  if (!match) {
    throw new Error('no sheet was generated');
  }
  return match[1];
}

describe('keyframes', () => {
  it('should namespace keyframes and their references', () => {
    const sheet = sheetOf(`
import { css } from 'solid-styled';

export default function Example() {
  css\`
    @keyframes fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    h1 {
      animation-name: fade;
    }
  \`;
  return <h1>Hello World</h1>;
}
`);
    expect(sheet).toMatch(/@keyframes c-[0-9a-f]+-0-fade/);
    expect(sheet).toMatch(/animation-name:c-[0-9a-f]+-0-fade/);
  });

  it('should namespace keyframes used through the animation shorthand', () => {
    const sheet = sheetOf(`
import { css } from 'solid-styled';

export default function Example() {
  css\`
    @keyframes fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    h1 {
      animation: fade 1s linear;
    }
  \`;
  return <h1>Hello World</h1>;
}
`);
    expect(sheet).toMatch(/animation:1s linear c-[0-9a-f]+-0-fade/);
  });

  it('should leave unknown animation names alone', () => {
    const sheet = sheetOf(`
import { css } from 'solid-styled';

export default function Example() {
  css\`h1 { animation-name: elsewhere; }\`;
  return <h1>Hello World</h1>;
}
`);
    expect(sheet).toContain('animation-name:elsewhere');
  });
});

describe('@global', () => {
  it('should hoist an `@global` block out of the scope', () => {
    const sheet = sheetOf(`
import { css } from 'solid-styled';

export default function Example() {
  css\`
    @global {
      body { margin: 0; }
    }

    h1 { color: red; }
  \`;
  return <h1>Hello World</h1>;
}
`);
    expect(sheet).toContain('body{margin:0}');
    expect(sheet).toMatch(/h1\[s\\\\:c-[0-9a-f]+-0\]/);
  });

  it('should not namespace keyframes declared inside `@global`', () => {
    const sheet = sheetOf(`
import { css } from 'solid-styled';

export default function Example() {
  css\`
    @global {
      @keyframes fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    }

    h1 { animation-name: fade; }
  \`;
  return <h1>Hello World</h1>;
}
`);
    expect(sheet).toContain('@keyframes fade');
    expect(sheet).toContain('animation-name:fade');
  });
});
