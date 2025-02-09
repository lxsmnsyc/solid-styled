import type { JSX } from 'solid-js';
import {
  createComponent,
  createContext,
  createEffect,
  createMemo,
  createRoot,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js';
import { isServer, useAssets } from 'solid-js/web';

const SOLID_SHEET_ATTR = 's:id';
const SOLID_SHEET_ATTR_ESCAPED = 's\\:id';

const tracked = new Set();
const references = new Map<string, number>();

// Hydrate the sheets
if (!isServer) {
  const nodes = document.head.querySelectorAll(
    `style[${SOLID_SHEET_ATTR_ESCAPED}]`,
  );

  for (let i = 0, len = nodes.length; i < len; i++) {
    tracked.add(nodes[i].getAttribute(SOLID_SHEET_ATTR));
  }
}

function insert(id: string, sheet: string): void {
  if (!tracked.has(id)) {
    tracked.add(id);

    const node = document.createElement('style');
    node.setAttribute(SOLID_SHEET_ATTR, id);
    node.innerHTML = sheet;
    document.head.appendChild(node);
  }
  references.set(id, (references.get(id) ?? 0) + 1);
}

function remove(id: string): void {
  const count = references.get(id) ?? 0;
  if (count > 1) {
    references.set(id, count - 1);
  } else {
    references.set(id, 0);
    const node = document.head.querySelector(
      `style[${SOLID_SHEET_ATTR_ESCAPED}="${id}"]`,
    );
    if (node) {
      document.head.removeChild(node);
    }
    tracked.delete(id);
  }
}

interface StyleRegistryContextValue {
  insert(id: string, sheet: string): void;
  remove(id: string): void;
}

const StyleRegistryContext = createContext<StyleRegistryContextValue>();

export interface StyleData {
  id: string;
  sheet: string;
}

export interface StyleRegistryProps {
  auto?: boolean;
  styles?: StyleData[];
  children?: JSX.Element;
}

function noopRemove(_id: string): void {
  // no-op
}

function ServerStyleRegistry(props: StyleRegistryProps): JSX.Element {
  let styles = props.styles;

  if (props.auto) {
    const current = styles || [];
    styles = current;
    useAssets(
      () =>
        ({
          t: renderSheets(current),
        }) as unknown as JSX.Element,
    );
  }

  const sheets = new Set<string>();

  function serverInsert(id: string, sheet: string): void {
    if (!sheets.has(id)) {
      sheets.add(id);

      if (styles) {
        styles.push({ id, sheet });
      }
    }
  }

  return createComponent(StyleRegistryContext.Provider, {
    value: { insert: serverInsert, remove: noopRemove },
    get children() {
      return props.children;
    },
  });
}

function ClientStyleRegistry(props: StyleRegistryProps): JSX.Element {
  return createComponent(StyleRegistryContext.Provider, {
    value: { insert, remove },
    get children() {
      return props.children;
    },
  });
}

export const StyleRegistry = isServer
  ? ServerStyleRegistry
  : ClientStyleRegistry;

export type SolidStyledVariables = Record<string, string>;

function serverUseSolidStyled(id: string, offset: string, sheet: string): void {
  const ctx = useContext(StyleRegistryContext);
  if (ctx) {
    ctx.insert(`${id}-${offset}`, sheet);
  }
}

function clientUseSolidStyled(id: string, offset: string, sheet: string): void {
  const ctx = useContext(StyleRegistryContext) ?? { insert, remove };
  const index = `${id}-${offset}`;
  ctx.insert(index, sheet);
  onCleanup(() => {
    ctx.remove(index);
  });
}

export const useSolidStyled = isServer
  ? serverUseSolidStyled
  : clientUseSolidStyled;

function serializeStyle(source: JSX.CSSProperties): string {
  let result = '';
  for (const key in source) {
    result = `${result}${key}:${String(
      source[key as keyof JSX.CSSProperties],
    )};`;
  }
  return result;
}

function serializeRootStyle(vars?: () => Record<string, string>): string {
  return vars ? ':root{' + serializeStyle(untrack(vars)) + '}' : '';
}

function serverUseSolidStyledGlobal(
  id: string,
  offset: string,
  sheet: string,
  vars?: () => Record<string, string>,
): void {
  const ctx = useContext(StyleRegistryContext);
  if (ctx) {
    ctx.insert(`${id}-${offset}`, serializeRootStyle(vars) + sheet);
  }
}

function clientUseSolidStyledGlobal(
  id: string,
  offset: string,
  sheet: string,
  vars?: () => Record<string, string>,
): void {
  const index = `${id}-${offset}`;
  const ctx = useContext(StyleRegistryContext) ?? { insert, remove };
  ctx.insert(index, serializeRootStyle(vars) + sheet);
  createEffect(() => {
    if (vars) {
      const current = vars();
      for (const key in current) {
        document.documentElement.style.setProperty(key, current[key]);
      }
    }
  });
  onCleanup(() => {
    ctx.remove(index);
  });
}

export const useSolidStyledGlobal = isServer
  ? serverUseSolidStyledGlobal
  : clientUseSolidStyledGlobal;

type CSSVarsMerge = () => Record<string, string>;

interface CSSVars {
  (vars?: CSSVarsMerge): JSX.CSSProperties | undefined;
}

function createLazyMemo<T>(fn: () => T): () => T {
  let s: () => T;
  let dispose: (() => void) | undefined;
  onCleanup(() => {
    if (dispose) {
      dispose();
    }
  });
  return () => {
    if (!s) {
      s = createRoot(d => {
        dispose = d;
        return createMemo(fn);
      });
    }
    return s();
  };
}

export function createCSSVars(): CSSVars {
  const patches: CSSVarsMerge[] = [];
  const signal = createLazyMemo(() => {
    let source: JSX.CSSProperties = {};
    for (let i = 0, len = patches.length; i < len; i += 1) {
      source = Object.assign(source, patches[i]());
    }
    return source;
  });

  return (vars?: CSSVarsMerge) => {
    if (vars) {
      patches.push(vars);
      return undefined;
    }
    return signal();
  };
}

export function mergeStyles(
  source: JSX.CSSProperties | string | null | undefined,
  other: JSX.CSSProperties,
): string {
  const otherString = serializeStyle(other);
  if (source) {
    const sourceString =
      typeof source === 'string' ? source : serializeStyle(source);
    return `${sourceString};${otherString}`;
  }
  return otherString;
}

export function renderSheets(sheets: StyleData[]): string {
  let sheet = '';
  for (let i = 0, len = sheets.length; i < len; i += 1) {
    const data = sheets[i];
    sheet = `${sheet}<style ${SOLID_SHEET_ATTR}="${data.id}">${data.sheet}</style>`;
  }
  return sheet;
}

export interface CSSConstructor {
  (template: TemplateStringsArray, ...spans: (string | boolean)[]): void;
}

function invariant(methodName: string): Error {
  return new Error(
    `Unexpected use of \`${methodName}\`. Make sure that solid-styled's plugin is setup correctly.`,
  );
}

export const css: CSSConstructor = () => {
  throw invariant('css');
};
