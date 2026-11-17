// Client-side tests for sheets in shadow roots. An app rendered into a
// shadow root (host.attachShadow) gets no styling today, because every
// sheet lands in `document.head` and document styles do not cross the
// shadow boundary. `StyleRegistry` must accept the root node the sheets
// belong to (`root`), so a shadow-rendered tree carries its own sheets.
//
// Red until the runtime honors `root`: the prop is ignored right now, so
// every assertion that expects a sheet inside the shadow root fails.
import { type JSX, render } from '@solidjs/web';
import { createComponent } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';
import { StyleRegistry, useSolidStyled, useSolidStyledGlobal } from '../src/core';

const ESCAPED_ATTR = 's\\:id';

function styleIn(root: ParentNode, index: string): HTMLStyleElement | null {
  return root.querySelector<HTMLStyleElement>(`style[${ESCAPED_ATTR}="${index}"]`);
}

function hostWithShadow(): ShadowRoot {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host.attachShadow({ mode: 'open' });
}

// A component in the shape the compiler emits: it registers its sheet and
// returns a real element, so the sheet and the markup share one render.
function scoped(id: string, sheet: string): () => JSX.Element {
  return function Scoped(): JSX.Element {
    useSolidStyled(id, '0', sheet);
    const button = document.createElement('button');
    button.className = 'target';
    return button;
  };
}

describe('shadow roots', () => {
  const disposers: (() => void)[] = [];

  afterEach(() => {
    let dispose = disposers.pop();
    while (dispose) {
      dispose();
      dispose = disposers.pop();
    }
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('inserts scoped sheets into the registry root instead of document.head', () => {
    const shadow = hostWithShadow();
    const Scoped = scoped('shadow-a', '.a{color:red;}');
    disposers.push(
      render(
        () =>
          createComponent(StyleRegistry, {
            // Introduced by the fix; ignored today.
            root: shadow,
            get children() {
              return createComponent(Scoped, {});
            },
          }),
        shadow,
      ),
    );

    expect(styleIn(shadow, 'shadow-a-0')?.innerHTML).toBe('.a{color:red;}');
    expect(styleIn(document.head, 'shadow-a-0')).toBeNull();
  });

  it('keeps the same sheet in the document and the shadow root at once', () => {
    // The demo scenario: one app mounted in the light DOM and in a shadow
    // root. Both trees need the sheet; tracking it once globally starves
    // whichever tree mounts second.
    const Scoped = scoped('shadow-b', '.b{color:blue;}');

    const light = document.createElement('div');
    document.body.appendChild(light);
    disposers.push(render(() => createComponent(Scoped, {}), light));

    const shadow = hostWithShadow();
    disposers.push(
      render(
        () =>
          createComponent(StyleRegistry, {
            root: shadow,
            get children() {
              return createComponent(Scoped, {});
            },
          }),
        shadow,
      ),
    );

    expect(styleIn(document.head, 'shadow-b-0')?.innerHTML).toBe('.b{color:blue;}');
    expect(styleIn(shadow, 'shadow-b-0')?.innerHTML).toBe('.b{color:blue;}');
  });

  it('removes the sheet from the shadow root on dispose', () => {
    const shadow = hostWithShadow();
    const Scoped = scoped('shadow-c', '.c{color:green;}');
    const dispose = render(
      () =>
        createComponent(StyleRegistry, {
          root: shadow,
          get children() {
            return createComponent(Scoped, {});
          },
        }),
      shadow,
    );

    expect(styleIn(shadow, 'shadow-c-0')).not.toBeNull();
    dispose();
    expect(styleIn(shadow, 'shadow-c-0')).toBeNull();
    expect(shadow.querySelector('style')).toBeNull();
  });

  it('inserts global sheets into the registry root', () => {
    const shadow = hostWithShadow();
    function Global(): JSX.Element {
      useSolidStyledGlobal('shadow-d', '0', '.d{margin:0;}');
      return document.createElement('div');
    }
    disposers.push(
      render(
        () =>
          createComponent(StyleRegistry, {
            root: shadow,
            get children() {
              return createComponent(Global, {});
            },
          }),
        shadow,
      ),
    );

    expect(styleIn(shadow, 'shadow-d-0')?.innerHTML).toBe('.d{margin:0;}');
    expect(styleIn(document.head, 'shadow-d-0')).toBeNull();
  });

  // Control: the fix must not change where sheets go without a `root`.
  it('still inserts into document.head when no root is given', () => {
    const light = document.createElement('div');
    document.body.appendChild(light);
    const Scoped = scoped('shadow-e', '.e{color:black;}');
    disposers.push(
      render(
        () =>
          createComponent(StyleRegistry, {
            get children() {
              return createComponent(Scoped, {});
            },
          }),
        light,
      ),
    );

    expect(styleIn(document.head, 'shadow-e-0')?.innerHTML).toBe('.e{color:black;}');
  });
});
