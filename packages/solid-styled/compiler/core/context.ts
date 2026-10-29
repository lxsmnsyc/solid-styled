import type MagicString from 'magic-string';
import type { Analysis } from './analyze';
import type { Node } from './ast';
import { compileError } from './errors';
import type { SolidStyledOptions } from '../types';

export interface ScopedSheet {
  /** Identifier of the generated `const sheet_N = "<scope>"`. */
  id: string;
  scope: string;
  /** Number of sheets emitted for the owning function so far. */
  count: number;
}

/**
 * Mutable state for one compile pass: the MagicString being edited, the
 * analysis, the auto-import registry, and the per-function sheet and CSS
 * variable holders.
 */
export class Ctx {
  s: MagicString;
  code: string;
  opts: SolidStyledOptions;
  analysis: Analysis;
  names: Set<string>;
  /** Namespace hash of the module; seeds every generated id. */
  ns: string;
  ids = 0;
  imports = new Map<string, string>();
  importOrder: { name: string; local: string }[] = [];
  sheets = new Map<Node, ScopedSheet>();
  vars = new Map<Node, string>();

  constructor(
    s: MagicString,
    code: string,
    analysis: Analysis,
    opts: SolidStyledOptions,
    ns: string,
  ) {
    this.s = s;
    this.code = code;
    this.analysis = analysis;
    this.opts = opts;
    this.ns = ns;
    this.names = analysis.names;
  }

  /** Returns a collision-free identifier `base_N` and reserves it. */
  unique(base: string): string {
    let index = 1;
    while (this.names.has(`${base}_${index}`)) {
      index++;
    }
    const name = `${base}_${index}`;
    this.names.add(name);
    return name;
  }

  /** Sequential id, unique across the module and stable across builds. */
  uniqueId(): string {
    const current = this.ids;
    this.ids += 1;
    return `${this.ns}-${current}`;
  }

  /** Scope prefix for class markers (`c-`) or CSS variables (`v-`). */
  prefix(isVar = false): string {
    const fallback = isVar ? 'v-' : 'c-';
    return this.opts.prefix ? `${this.opts.prefix}-` : fallback;
  }

  /**
   * Returns the local identifier for a `solid-styled` runtime import,
   * registering it on first use. Locals are `_name`, uniquified on collision.
   */
  importIdent(name: string): string {
    const existing = this.imports.get(name);
    if (existing) {
      return existing;
    }
    let local = `_${name}`;
    if (this.names.has(local)) {
      local = this.unique(`_${name}`);
    }
    this.names.add(local);
    this.imports.set(name, local);
    this.importOrder.push({ name, local });
    return local;
  }

  /** Throws a `CompileError` located at the node. */
  error(node: Node, message: string): never {
    compileError(this.code, node, message);
  }

  /** Prepends the runtime import header, in first-use order. */
  finalize(): void {
    if (this.importOrder.length === 0) {
      return;
    }
    const specifiers = this.importOrder
      .map((entry) => `${entry.name} as ${entry.local}`)
      .join(', ');
    this.s.prepend(`import { ${specifiers} } from "solid-styled";\n`);
  }
}
