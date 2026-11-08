/* oxlint-disable class-methods-use-this -- `check` must be an instance method for fc.Command. */
// Model-based test of the sheet registry in `src/core.ts`.
//
// `isServer` is fixed when `@solidjs/web` loads, so `vitest.config.ts` runs
// this file twice: once with the browser condition and happy-dom (client path),
// once on node (server path). The block that matches the project runs.
import { children, createComponent, createEffect, createRoot, createSignal, flush } from 'solid-js';
import { type JSX, isServer, renderToString } from '@solidjs/web';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  type StyleData,
  StyleRegistry,
  renderSheets,
  useSolidStyled,
  useSolidStyledGlobal,
} from '../src/core';

const SEED = 20260508;
const NUM_RUNS = 150;

const IDS = ['a', 'b', 'c'];
const OFFSETS = ['0', '1'];
const CSS_CHAR = fc.constantFrom(...'abcdefgh0123456789:;.{}#-'.split(''));
const SHEET = fc.string({ unit: CSS_CHAR, minLength: 1, maxLength: 12 });

interface Entry {
  id: string;
  offset: string;
  sheet: string;
  global: boolean;
  vars: Record<string, string> | undefined;
}

const VAR_VALUE = fc.constantFrom('red', '1px', '10', 'blue', '2rem');

const ENTRY = fc.record({
  id: fc.constantFrom(...IDS),
  offset: fc.constantFrom(...OFFSETS),
  sheet: SHEET,
  global: fc.boolean(),
  hasVars: fc.boolean(),
  value: VAR_VALUE,
});

function indexOf(entry: { id: string; offset: string }): string {
  return `${entry.id}-${entry.offset}`;
}

function serializeVars(vars: Record<string, string> | undefined): string {
  if (!vars) {
    return '';
  }
  let body = '';
  for (const [key, value] of Object.entries(vars)) {
    body = `${body}${key}:${value};`;
  }
  return `:root{${body}}`;
}

// What the registry stores for an entry the first time its index is inserted.
function expectedSheet(entry: Entry): string {
  return entry.global ? serializeVars(entry.vars) + entry.sheet : entry.sheet;
}

function runModel<Model extends object, Real>(
  commands: Iterable<fc.Command<Model, Real>>,
  setup: () => { model: Model; real: Real },
): void {
  fc.modelRun(setup, commands);
}

if (isServer) {
  // Server model: every render gets its own registry. A sheet is stored once
  // per index, the first sheet wins, and `renderSheets` prints each once.
  interface ServerModel {
    renders: number;
  }
  interface ServerReal {
    outputs: string[];
  }

  class RenderCommand implements fc.Command<ServerModel, ServerReal> {
    constructor(
      readonly entries: Entry[],
      readonly withRegistry: boolean,
    ) {}

    check(): boolean {
      return true;
    }

    run(model: ServerModel, real: ServerReal): void {
      const styles: StyleData[] = [];
      const { entries } = this;
      const renderEntries = (): JSX.Element[] => {
        const nodes: JSX.Element[] = [];
        for (const entry of entries) {
          nodes.push(createComponent(Entry, { entry }));
        }
        return nodes;
      };
      const html = renderToString(() =>
        this.withRegistry
          ? createComponent(StyleRegistry, {
              styles,
              get children() {
                return renderEntries();
              },
            })
          : renderEntries(),
      );
      real.outputs.push(html);
      model.renders += 1;

      // Expected: first sheet per index, in first-use order.
      const expected = new Map<string, string>();
      if (this.withRegistry) {
        for (const entry of entries) {
          const index = indexOf(entry);
          if (!expected.has(index)) {
            expected.set(index, expectedSheet(entry));
          }
        }
      }

      expect(styles.map((s) => [s.id, s.sheet])).toEqual([...expected]);

      const rendered = renderSheets(styles);
      for (const [index, sheet] of expected) {
        const tag = `<style s:id="${index}">${sheet}</style>`;
        expect(rendered.split(tag).length - 1).toBe(1);
      }
      expect(rendered.split('<style ').length - 1).toBe(expected.size);
    }

    toString(): string {
      return `render(${this.withRegistry ? 'registry' : 'bare'}, ${JSON.stringify(this.entries)})`;
    }
  }

  function Entry(props: { entry: Entry }): undefined {
    const { entry } = props;
    if (entry.global) {
      useSolidStyledGlobal(
        entry.id,
        entry.offset,
        entry.sheet,
        entry.vars ? () => entry.vars! : undefined,
      );
    } else {
      useSolidStyled(entry.id, entry.offset, entry.sheet);
    }
    return undefined;
  }

  describe('registry model (server)', () => {
    it('keeps each sheet once per registry', () => {
      const entry = ENTRY.map((e): Entry => ({
        id: e.id,
        offset: e.offset,
        sheet: e.sheet,
        global: e.global,
        vars: e.hasVars ? { '--x': e.value } : undefined,
      }));
      const command = fc
        .tuple(fc.array(entry, { maxLength: 8 }), fc.boolean())
        .map(([entries, withRegistry]) => new RenderCommand(entries, withRegistry));
      fc.assert(
        fc.property(fc.commands([command], { maxCommands: 10 }), (commands) => {
          runModel(commands, () => ({ model: { renders: 0 }, real: { outputs: [] } }));
        }),
        { seed: SEED, numRuns: NUM_RUNS },
      );
    });

    it('renders no sheets without a registry', () => {
      const html = renderToString(() =>
        createComponent(Entry, {
          entry: { id: 'a', offset: '0', sheet: 'x', global: false, vars: undefined },
        }),
      );
      expect(html).not.toContain('<style');
    });
  });
} else {
  // Client model: a `Map<index, count>` plus the sheet stored at the first
  // insert. Each mount is a Solid root, so disposing it runs the cleanups.
  interface Mounted {
    entry: Entry;
    dispose: () => void;
    setValue: ((value: string) => void) | undefined;
    value: string;
    varName: string | undefined;
  }
  interface ClientModel {
    mounted: (Mounted | undefined)[];
    counts: Map<string, number>;
    sheets: Map<string, string>;
    nextVar: number;
  }
  // The real system is the module state of `src/core.ts` and the DOM, so
  // there is nothing to carry besides the model.
  type ClientReal = Record<string, never>;

  function checkInvariants(model: ClientModel): void {
    const nodes = document.head.querySelectorAll('style');
    const found = new Map<string, string[]>();
    for (const node of nodes) {
      const id = node.getAttribute('s:id')!;
      const list = found.get(id) ?? [];
      list.push(node.innerHTML);
      found.set(id, list);
    }

    // One tag per live index, none for count 0, content equals the sheet.
    let live = 0;
    for (const [index, count] of model.counts) {
      if (count > 0) {
        live += 1;
        expect(found.get(index), `style for ${index}`).toEqual([model.sheets.get(index)]);
      } else {
        expect(found.has(index), `no style for ${index}`).toBe(false);
      }
    }
    expect(found.size).toBe(live);

    // Variables written by a live root hold its latest value.
    for (const item of model.mounted) {
      if (item?.varName) {
        expect(document.documentElement.style.getPropertyValue(item.varName)).toBe(item.value);
      }
    }
  }

  function varTargets(model: ClientModel): number[] {
    return mountedOf(model).filter((i) => model.mounted[i]!.setValue);
  }

  function mountedOf(model: ClientModel): number[] {
    const result: number[] = [];
    for (const [i, item] of model.mounted.entries()) {
      if (item) {
        result.push(i);
      }
    }
    return result;
  }

  class MountCommand implements fc.Command<ClientModel, ClientReal> {
    constructor(
      readonly entry: Entry,
      readonly withRegistry: boolean,
      readonly value: string,
    ) {}

    check(): boolean {
      return true;
    }

    run(model: ClientModel): void {
      const { entry } = this;
      const varName = entry.global && entry.vars ? `--v${model.nextVar++}` : undefined;
      const initial = varName ? { [varName]: this.value } : undefined;
      const expected = expectedSheet({ ...entry, vars: initial });
      const [value, setValue] = createSignal(this.value);

      const dispose = createRoot((d) => {
        const body = (): undefined => {
          if (entry.global) {
            useSolidStyledGlobal(
              entry.id,
              entry.offset,
              entry.sheet,
              varName ? () => ({ [varName]: value() }) : undefined,
            );
          } else {
            useSolidStyled(entry.id, entry.offset, entry.sheet);
          }
          return undefined;
        };
        if (this.withRegistry) {
          // Solid 2 only reads children that something observes, and it
          // disposes unobserved ones, so an effect reads them here.
          const resolved = children(() =>
            createComponent(StyleRegistry, {
              get children() {
                body();
                return document.createElement('span');
              },
            }),
          );
          createEffect(
            () => resolved(),
            () => {},
          );
        } else {
          body();
        }
        return d;
      });
      flush();

      const item: Mounted = {
        entry,
        dispose,
        setValue: varName ? setValue : undefined,
        value: this.value,
        varName,
      };
      model.mounted.push(item);

      const index = indexOf(entry);
      const count = model.counts.get(index) ?? 0;
      if (count === 0) {
        model.sheets.set(index, expected);
      }
      model.counts.set(index, count + 1);
      checkInvariants(model);
    }

    toString(): string {
      return `mount(${indexOf(this.entry)}, ${JSON.stringify(this.entry.sheet)}, global=${this.entry.global}, vars=${this.entry.vars !== undefined}, registry=${this.withRegistry})`;
    }
  }

  class DisposeCommand implements fc.Command<ClientModel, ClientReal> {
    constructor(readonly pick: number) {}

    check(model: ClientModel): boolean {
      return mountedOf(model).length > 0;
    }

    run(model: ClientModel): void {
      const live = mountedOf(model);
      const at = live[this.pick % live.length];
      const item = model.mounted[at]!;
      model.mounted[at] = undefined;
      item.dispose();
      flush();

      const index = indexOf(item.entry);
      model.counts.set(index, model.counts.get(index)! - 1);
      checkInvariants(model);
    }

    toString(): string {
      return `dispose(#${this.pick})`;
    }
  }

  class UpdateVarsCommand implements fc.Command<ClientModel, ClientReal> {
    constructor(
      readonly pick: number,
      readonly value: string,
    ) {}

    check(model: ClientModel): boolean {
      return varTargets(model).length > 0;
    }

    run(model: ClientModel): void {
      const targets = varTargets(model);
      const item = model.mounted[targets[this.pick % targets.length]]!;
      item.setValue!(this.value);
      item.value = this.value;
      flush();
      checkInvariants(model);
    }

    toString(): string {
      return `updateVars(#${this.pick}, ${this.value})`;
    }
  }

  describe('registry model (client)', () => {
    it('keeps one style tag per live sheet', () => {
      const entry = ENTRY.map((e): { entry: Entry; value: string } => ({
        entry: {
          id: e.id,
          offset: e.offset,
          sheet: e.sheet,
          global: e.global,
          vars: e.hasVars ? { '--x': e.value } : undefined,
        },
        value: e.value,
      }));
      const commands = [
        fc
          .tuple(entry, fc.boolean())
          .map(([e, registry]) => new MountCommand(e.entry, registry, e.value)),
        fc.nat(20).map((pick) => new DisposeCommand(pick)),
        fc.tuple(fc.nat(20), VAR_VALUE).map(([pick, value]) => new UpdateVarsCommand(pick, value)),
      ];

      fc.assert(
        fc.property(fc.commands(commands, { maxCommands: 40 }), (cmds) => {
          const model: ClientModel = {
            mounted: [],
            counts: new Map(),
            sheets: new Map(),
            nextVar: 0,
          };
          try {
            runModel(cmds, () => ({ model, real: {} }));
          } finally {
            // Tear down so the next run starts from an empty registry.
            for (const item of model.mounted) {
              item?.dispose();
            }
            flush();
            document.documentElement.removeAttribute('style');
          }
          expect(document.head.querySelectorAll('style').length).toBe(0);
        }),
        { seed: SEED, numRuns: NUM_RUNS },
      );
    });
  });
}
