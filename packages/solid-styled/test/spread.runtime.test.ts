import * as web from '@solidjs/web';
import * as solid from 'solid-js';
import { createComponent, createSignal, flush } from 'solid-js';
import { describe, expect, inject, it } from 'vitest';
import * as runtime from '../src';

type Component = (props: object) => unknown;

const MODULES: Record<string, unknown> = {
  '@solidjs/web': web,
  'solid-js': solid,
  'solid-styled': runtime,
};

const IMPORT = /^import \{([^}]*)\} from "([^"]+)";$/gm;

/**
 * Runs the compiled fixtures (see `runtime/compile.ts`) as a function body,
 * with each import read from the modules this test already loaded.
 */
function loadFixtures(code: string): Record<string, Component> {
  const body = code
    .replace(IMPORT, (_line, names: string, from: string) => {
      const bindings = names.replaceAll(' as ', ': ');
      return `const {${bindings}} = __modules[${JSON.stringify(from)}];`;
    })
    .replaceAll('export function ', 'function ');
  const exported: string[] = [];
  for (const match of body.matchAll(/^function (\w+)/gm)) {
    exported.push(match[1]);
  }
  // The test runs the compiled fixtures on purpose.
  // oxlint-disable-next-line no-new-func, typescript/no-implied-eval
  const run = new Function('__modules', `${body}\nreturn { ${exported.join(', ')} };`);
  return run(MODULES) as Record<string, Component>;
}

const fixtures = loadFixtures(inject('spreadCases'));

function mount(component: Component, props: object): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  web.render(() => createComponent(component, props), container);
  flush();
  return container;
}

function readStyle(root: HTMLElement, id: string): string {
  return root.querySelector(`#${id}`)?.getAttribute('style') ?? '';
}

describe('spread styles at runtime', () => {
  it('should follow a spread that gains and loses a style key', () => {
    const [color, setColor] = createSignal('red');
    const [attrs, setAttrs] = createSignal<object>({});
    const root = mount(fixtures.SignalSource, {
      get color() {
        return color();
      },
      attrs,
    });
    expect(readStyle(root, 'signal')).toMatch(/^margin: 0px; --[\w-]+: red;$/);

    setAttrs({ style: 'top: 1px' });
    flush();
    expect(readStyle(root, 'signal')).toMatch(/^top: 1px; --[\w-]+: red;$/);

    setColor('blue');
    flush();
    expect(readStyle(root, 'signal')).toMatch(/^top: 1px; --[\w-]+: blue;$/);

    setAttrs({});
    flush();
    expect(readStyle(root, 'signal')).toMatch(/^margin: 0px; --[\w-]+: blue;$/);
  });

  it('should keep every key of an accessor spread', () => {
    const [src, setSrc] = createSignal<object>({ style: { top: '1px' }, title: 'a' });
    const root = mount(fixtures.AccessorSource, { color: 'red', src });
    const element = root.querySelector('#accessor');
    expect(element?.getAttribute('title')).toBe('a');
    expect(readStyle(root, 'accessor')).toMatch(/^top: 1px; --[\w-]+: red;$/);

    setSrc({ style: 'left: 2px', title: 'b' });
    flush();
    expect(element?.getAttribute('title')).toBe('b');
    expect(readStyle(root, 'accessor')).toMatch(/^left: 2px; --[\w-]+: red;$/);

    setSrc({ title: 'c' });
    flush();
    expect(element?.getAttribute('title')).toBe('c');
    expect(readStyle(root, 'accessor')).toMatch(/^--[\w-]+: red;$/);
  });
});
