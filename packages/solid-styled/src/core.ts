import type { JSX } from '@solidjs/web';
import {
  createComponent,
  createContext,
  createEffect,
  createMemo,
  merge,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js';
import { isServer, useHead } from '@solidjs/web';

const SOLID_SHEET_ATTR = 's:id';
const SOLID_SHEET_ATTR_ESCAPED = 's\\:id';

const tracked = new Set();
const references = new Map<string, number>();

// The nonce of the server rendered sheets, reused for sheets inserted later.
let hydratedNonce: string | undefined;

// Browsers hide the `nonce` attribute once the element is in the document, so
// the property is read first.
function readNonce(node: HTMLElement): string | undefined {
  // An empty string means no nonce, so both reads fall through on it.
  if (node.nonce) {
    return node.nonce;
  }
  const nonce = node.getAttribute('nonce');
  if (nonce) {
    return nonce;
  }
  return undefined;
}

// Hydrate the sheets
if (!isServer) {
  const nodes = document.head.querySelectorAll<HTMLStyleElement>(
    `style[${SOLID_SHEET_ATTR_ESCAPED}]`,
  );

  for (let i = 0, len = nodes.length; i < len; i++) {
    tracked.add(nodes[i].getAttribute(SOLID_SHEET_ATTR));
    hydratedNonce ??= readNonce(nodes[i]);
  }
}

function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function noopInsert(_id: string, _sheet: string): void {
  // no-op
}

function noopRemove(_id: string): void {
  // no-op
}

function clientInsert(id: string, sheet: string, nonce = hydratedNonce): void {
  if (!tracked.has(id)) {
    tracked.add(id);

    const node = document.createElement('style');
    node.setAttribute(SOLID_SHEET_ATTR, id);
    if (nonce) {
      node.setAttribute('nonce', nonce);
    }
    node.innerHTML = sheet;
    document.head.appendChild(node);
  }
  references.set(id, (references.get(id) ?? 0) + 1);
}

function clientRemove(id: string): void {
  const count = references.get(id) ?? 0;
  if (count > 1) {
    references.set(id, count - 1);
  } else {
    references.set(id, 0);
    const node = document.head.querySelector(`style[${SOLID_SHEET_ATTR_ESCAPED}="${id}"]`);
    if (node) {
      document.head.removeChild(node);
    }
    tracked.delete(id);
  }
}

const insert = isServer ? noopInsert : clientInsert;
const remove = isServer ? noopRemove : clientRemove;

interface StyleRegistryContextValue {
  insert(id: string, sheet: string): void;
  remove(id: string): void;
}

// A default keeps `useSolidStyled` working without a `StyleRegistry`: Solid 2
// throws on a default-less context that has no provider above it.
const StyleRegistryContext = createContext<StyleRegistryContextValue>({
  insert,
  remove,
});

export interface StyleData {
  id: string;
  sheet: string;
}

export interface StyleRegistryProps {
  auto?: boolean;
  /**
   * CSP nonce for the `<style>` elements, matching `'nonce-...'` in the
   * `style-src` directive. On the client it defaults to the nonce of the
   * server rendered sheets.
   */
  nonce?: string;
  styles?: StyleData[];
  children?: JSX.Element;
}

function ServerStyleRegistry(props: StyleRegistryProps): JSX.Element {
  let styles = props.styles;

  if (props.auto) {
    const current = styles ?? [];
    styles = current;
    // Solid resolves head tags at flush time, so sheets collected while the
    // children render are still picked up here.
    useHead(() => {
      const tags = [];
      for (const data of current) {
        tags.push({
          tag: 'style' as const,
          props: { [SOLID_SHEET_ATTR]: data.id, nonce: props.nonce, children: data.sheet },
          key: data.id,
        });
      }
      return tags;
    });
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

  return createComponent(StyleRegistryContext, {
    value: { insert: serverInsert, remove: noopRemove },
    get children() {
      return props.children;
    },
  });
}

function ClientStyleRegistry(props: StyleRegistryProps): JSX.Element {
  function insertWithNonce(id: string, sheet: string): void {
    clientInsert(id, sheet, props.nonce ?? hydratedNonce);
  }

  return createComponent(StyleRegistryContext, {
    value: { insert: insertWithNonce, remove },
    get children() {
      return props.children;
    },
  });
}

export const StyleRegistry = isServer ? ServerStyleRegistry : ClientStyleRegistry;

export type SolidStyledVariables = Record<string, string>;

function serverUseSolidStyled(id: string, offset: string, sheet: string): void {
  useContext(StyleRegistryContext).insert(`${id}-${offset}`, sheet);
}

function clientUseSolidStyled(id: string, offset: string, sheet: string): void {
  const ctx = useContext(StyleRegistryContext);
  const index = `${id}-${offset}`;
  ctx.insert(index, sheet);
  onCleanup(() => {
    ctx.remove(index);
  });
}

export const useSolidStyled = isServer ? serverUseSolidStyled : clientUseSolidStyled;

function serializeStyle(source: JSX.CSSProperties): string {
  let result = '';
  for (const [key, value] of Object.entries(source)) {
    result = `${result}${key}:${String(value)};`;
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
  useContext(StyleRegistryContext).insert(`${id}-${offset}`, serializeRootStyle(vars) + sheet);
}

function clientUseSolidStyledGlobal(
  id: string,
  offset: string,
  sheet: string,
  vars?: () => Record<string, string>,
): void {
  const index = `${id}-${offset}`;
  const ctx = useContext(StyleRegistryContext);
  ctx.insert(index, serializeRootStyle(vars) + sheet);
  createEffect(
    () => vars?.(),
    (current) => {
      if (current) {
        for (const [key, value] of Object.entries(current)) {
          document.documentElement.style.setProperty(key, value);
        }
      }
    },
  );
  onCleanup(() => {
    ctx.remove(index);
  });
}

export const useSolidStyledGlobal = isServer
  ? serverUseSolidStyledGlobal
  : clientUseSolidStyledGlobal;

type CSSVarsMerge = () => Record<string, string>;

type CSSVars = (vars?: CSSVarsMerge) => JSX.CSSProperties | undefined;

export function createCSSVars(): CSSVars {
  const patches: CSSVarsMerge[] = [];
  const signal = createMemo(
    () => {
      let source: JSX.CSSProperties = {};
      for (let i = 0, len = patches.length; i < len; i += 1) {
        source = Object.assign(source, patches[i]());
      }
      return source;
    },
    {
      lazy: true,
    },
  );

  return (vars?: CSSVarsMerge) => {
    if (typeof vars === 'function') {
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
    const sourceString = typeof source === 'string' ? source : serializeStyle(source);
    return `${sourceString};${otherString}`;
  }
  return otherString;
}

/**
 * Compiler helper for a spread on an element with CSS variables:
 * `{...source}` becomes `{...spreadStyle(source, vars_1)}`. A source with a
 * `style` key gets that style merged with the variables, through `merge` so
 * getters and reactivity survive. Any other source is returned as is, so the
 * key set, and which source wins `style`, does not change.
 */
export function spreadStyle(input: unknown, ...varsList: CSSVars[]): unknown {
  // Solid reads a function spread source, such as `{...signal}`, by calling
  // it. This runs inside Solid's own function source, so it stays tracked.
  const source = isAccessor(input) ? input() : input;
  if (!hasStyleKey(source)) {
    return source;
  }
  return merge(source, {
    get style() {
      let style = source.style;
      for (const vars of varsList) {
        style = mergeStyles(style, vars() ?? {});
      }
      return style;
    },
  });
}

interface StyledSource {
  style?: JSX.CSSProperties | string | null;
}

function isAccessor(value: unknown): value is () => unknown {
  return typeof value === 'function';
}

function hasStyleKey(source: unknown): source is StyledSource {
  return source != null && typeof source === 'object' && 'style' in source;
}

/**
 * Renders the collected sheets as `<style>` elements. Pass the CSP nonce of
 * the response to put it on every element.
 */
export function renderSheets(sheets: StyleData[], nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${escapeAttribute(nonce)}"` : '';
  let sheet = '';
  for (let i = 0, len = sheets.length; i < len; i += 1) {
    const data = sheets[i];
    sheet = `${sheet}<style ${SOLID_SHEET_ATTR}="${data.id}"${nonceAttr}>${data.sheet}</style>`;
  }
  return sheet;
}

export type CSSConstructor = (
  template: TemplateStringsArray,
  ...spans: (string | boolean)[]
) => void;

function invariant(methodName: string): Error {
  return new Error(
    `Unexpected use of \`${methodName}\`. Make sure that solid-styled's plugin is setup correctly.`,
  );
}

export const css: CSSConstructor = () => {
  throw invariant('css');
};
