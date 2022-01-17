import {
  createContext,
  createEffect,
  JSX,
  onCleanup,
  useContext,
} from 'solid-js';
import { isServer } from 'solid-js/web';

interface StyleRegistryContext {
  insert(id: string, sheet: string): void;
  remove(id: string): void;
}

const StyleRegistryContext = createContext<StyleRegistryContext>();

const SOLID_SHEET_ATTR = 'data-s';
const SOLID_STYLED_ATTR = 'data-s';

export interface StyleData {
  id: string;
  sheet: string;
}

export interface StyleRegistryProps {
  styles: StyleData[];
  children?: JSX.Element;
}

export function StyleRegistry(props: StyleRegistryProps): JSX.Element {
  const tracked = new Set();
  const references = new Map<string, number>();

  if (!isServer) {
    document.head.querySelectorAll(`style[${SOLID_SHEET_ATTR}]`).forEach((node) => {
      tracked.add(node.getAttribute(SOLID_SHEET_ATTR));
    });
  }

  function insert(id: string, sheet: string) {
    if (!tracked.has(id)) {
      tracked.add(id);

      if (isServer) {
        props.styles.push({ id, sheet });
      } else {
        const node = document.createElement('style');
        node.setAttribute(SOLID_SHEET_ATTR, id);
        node.innerHTML = sheet;
        document.head.appendChild(node);
      }
    }
    references.set(id, (references.get(id) ?? 0) + 1);
  }

  function remove(id: string) {
    const count = references.get(id) ?? 0;
    if (count > 1) {
      references.set(id, count - 1);
    } else {
      references.set(id, 0);
      const node = document.head.querySelector(`style[${SOLID_SHEET_ATTR}="${id}"]`);
      if (node) {
        document.head.removeChild(node);
      }
    }
  }

  return (
    <StyleRegistryContext.Provider value={{ insert, remove }}>
      {props.children}
    </StyleRegistryContext.Provider>
  );
}

export type SolidStyledVariables = Record<string, () => string>;

export function useSolidStyled(
  id: string,
  scope: string,
  variables: SolidStyledVariables,
  sheet: string,
): void {
  const ctx = useContext(StyleRegistryContext);

  if (!ctx) {
    throw new Error('Missing StyleRegistry');
  }
  ctx.insert(id, sheet);
  onCleanup(() => ctx.remove(id));

  createEffect<Record<string, string>>((prev) => {
    const nodes = document.querySelectorAll(`[${SOLID_STYLED_ATTR}-${id}="${scope}"]`);
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(variables)) {
      const value = variables[key]();
      if (prev[key] !== value) {
        // eslint-disable-next-line no-param-reassign
        prev[key] = value;

        nodes.forEach((node) => {
          (node as HTMLElement).style.setProperty(`--${key}`, value);
        });
      }
    }
    return prev;
  }, {});
}

export function renderSheets(sheets: StyleData[]): string {
  return sheets.map((data) => `<style ${SOLID_SHEET_ATTR}="${data.id}">${data.sheet}</style>`)
    .join('');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function css(_template: TemplateStringsArray, ..._spans: string[]): void {
  throw new Error('Unexpected use of `css`');
}
