// Reads the newest `.cpuprofile` in a folder and attributes every sample
// taken inside `compile()` to a stage: the innermost frame that belongs to a
// known library, or the nearest known compiler function for frames inside
// `solid-styled/compiler`.
// Usage: node scripts/attribute.ts <profile-dir>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface CallFrame {
  functionName: string;
  url: string;
  lineNumber: number;
}

interface ProfileNode {
  id: number;
  callFrame: CallFrame;
  children?: number[];
}

interface CpuProfile {
  nodes: ProfileNode[];
  samples: number[];
  timeDeltas: number[];
}

type Parents = Map<number, ProfileNode>;

function isCpuProfile(value: unknown): value is CpuProfile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nodes' in value &&
    Array.isArray(value.nodes) &&
    'samples' in value &&
    Array.isArray(value.samples) &&
    'timeDeltas' in value &&
    Array.isArray(value.timeDeltas)
  );
}

const LIBRARIES = [
  {
    name: 'browserslist resolution',
    // LightningCSS's `browserslistToTargets` turns the query result into
    // targets on every call, so it counts as resolution too.
    match: /\/(browserslist|caniuse-lite|electron-to-chromium)\/|browserslistToTargets\.js$/,
  },
  { name: 'LightningCSS transform', match: /\/lightningcss[^/]*\// },
  { name: 'css-tree parse/walk/generate', match: /\/css-tree\// },
  { name: 'oxc parse', match: /\/(oxc-parser|@oxc-parser)/ },
  { name: 'MagicString', match: /\/magic-string\// },
];

// Compiler functions that start a stage. Frames inside the compiler are
// charged to the nearest of these on their stack.
const COMPILER_STAGES = new Map([
  ['analyze', 'analyze (AST walk)'],
  ['xxHash32', 'xxhash'],
  ['processScopedSheet', 'scoped sheet rewrite (JS around css-tree)'],
  ['preprocessCSS', 'preprocessCSS glue (TextEncoder/Decoder)'],
  ['replaceDynamicTemplate', 'template interpolation'],
  ['transform', 'transform (span edits)'],
  ['compile', 'compile glue'],
]);

const COMPILER_URL = /solid-styled\/dist\/compiler\.js$/;

function findNewestProfile(dir: string): string {
  let newest: { path: string; time: number } | null = null;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.cpuprofile')) {
      continue;
    }
    const path = join(dir, file);
    const time = statSync(path).mtimeMs;
    if (!newest || time > newest.time) {
      newest = { path, time };
    }
  }
  if (!newest) {
    throw new Error(`no .cpuprofile in ${dir}`);
  }
  return newest.path;
}

/** True when the sample's stack runs through the compiler's `compile()`. */
function isInsideCompile(leaf: ProfileNode, parents: Parents): boolean {
  for (let node: ProfileNode | undefined = leaf; node; node = parents.get(node.id)) {
    if (node.callFrame.functionName === 'compile' && COMPILER_URL.test(node.callFrame.url)) {
      return true;
    }
  }
  return false;
}

function matchLibrary(url: string): string | null {
  for (const library of LIBRARIES) {
    if (library.match.test(url)) {
      return library.name;
    }
  }
  return null;
}

function classifyMagicString(node: ProfileNode, parents: Parents): string {
  for (let current: ProfileNode | undefined = node; current; current = parents.get(current.id)) {
    const name = current.callFrame.functionName;
    if (name === 'generateMap' || name === 'generateDecodedMap') {
      return 'MagicString generateMap (hires)';
    }
    if (name === 'toString' && current.callFrame.url.includes('/magic-string/')) {
      return 'MagicString toString';
    }
  }
  return 'MagicString edits';
}

/**
 * Returns the stage a sample belongs to, from its leaf frame up to the root.
 * Samples outside `compile()` (module loading, warm-up glue, GC, idle) are
 * returned as `null` and left out of the shares.
 */
function classify(leaf: ProfileNode, parents: Parents): string | null {
  if (!isInsideCompile(leaf, parents)) {
    return null;
  }
  let insideCompiler = false;
  for (let node: ProfileNode | undefined = leaf; node; node = parents.get(node.id)) {
    const url = node.callFrame.url;
    // Library frames count only below the first compiler frame.
    const library = insideCompiler ? null : matchLibrary(url);
    if (library === 'MagicString') {
      return classifyMagicString(node, parents);
    }
    if (library) {
      return library;
    }
    if (COMPILER_URL.test(url)) {
      insideCompiler = true;
      const stage = COMPILER_STAGES.get(node.callFrame.functionName);
      if (stage) {
        return stage;
      }
    }
  }
  return 'other';
}

function describeFrame(frame: CallFrame): string {
  // Keep the path after node_modules or packages, which is enough to find it.
  const file = /(?:node_modules|packages)\/(.*)$/.exec(frame.url)?.[1] ?? '(native)';
  const name = frame.functionName === '' ? '(anonymous)' : frame.functionName;
  return `${name} ${file}:${frame.lineNumber + 1}`;
}

function sortByTime(entries: Map<string, number>): [string, number][] {
  return [...entries].sort((a, b) => b[1] - a[1]);
}

function printProfile(path: string): void {
  const profile: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isCpuProfile(profile)) {
    throw new Error(`${path} is not a V8 CPU profile`);
  }
  const byId = new Map<number, ProfileNode>();
  const parents: Parents = new Map();
  for (const node of profile.nodes) {
    byId.set(node.id, node);
    for (const child of node.children ?? []) {
      parents.set(child, node);
    }
  }

  // Sum the sample time per stage and per leaf frame.
  const stages = new Map<string, number>();
  const selfTime = new Map<string, number>();
  let total = 0;
  let outside = 0;
  let gc = 0;
  for (let index = 0; index < profile.samples.length; index += 1) {
    const leaf = byId.get(profile.samples[index]);
    if (!leaf) {
      continue;
    }
    const delta = (profile.timeDeltas[index] ?? 0) / 1000;
    const stage = classify(leaf, parents);
    if (stage === null) {
      // GC samples have no JS stack, so they are counted on their own.
      if (leaf.callFrame.functionName === '(garbage collector)') {
        gc += delta;
      } else if (leaf.callFrame.functionName !== '(idle)') {
        outside += delta;
      }
      continue;
    }
    total += delta;
    stages.set(stage, (stages.get(stage) ?? 0) + delta);
    const key = describeFrame(leaf.callFrame);
    selfTime.set(key, (selfTime.get(key) ?? 0) + delta);
  }

  // Print the totals, then the stages and the top leaf frames by share.
  console.log(`profile: ${path}`);
  console.log(`inside compile(): ${total.toFixed(1)} ms`);
  console.log(`GC (not attributed): ${gc.toFixed(1)} ms`);
  console.log(`outside compile() (startup, loop): ${outside.toFixed(1)} ms`);
  const stageRows: Record<string, string>[] = [];
  for (const [stage, time] of sortByTime(stages)) {
    stageRows.push({ stage, ms: time.toFixed(1), 'share (%)': ((time / total) * 100).toFixed(1) });
  }
  console.table(stageRows);
  const selfRows: Record<string, string>[] = [];
  for (const [frame, time] of sortByTime(selfTime).slice(0, 25)) {
    selfRows.push({
      frame,
      'self ms': time.toFixed(1),
      'share (%)': ((time / total) * 100).toFixed(1),
    });
  }
  console.table(selfRows);
}

printProfile(findNewestProfile(process.argv[2] ?? 'profiles'));
