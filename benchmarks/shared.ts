// Fixture loading and result printing shared by the bench scripts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Bench, BenchOptions } from 'tinybench';

export const FIXTURES = ['small', 'large', 'no-styles', 'global-heavy'];

export interface Fixture {
  id: string;
  code: string;
}

/**
 * Reads `fixtures/<name>.tsx` and returns its code and an id under `<cwd>/src`,
 * so the unplugin default `include` filter matches it.
 */
export function readFixture(name: string): Fixture {
  const path = fileURLToPath(new URL(`fixtures/${name}.tsx`, import.meta.url));
  return { id: join(process.cwd(), 'src', `${name}.tsx`), code: readFileSync(path, 'utf8') };
}

/** Bench settings: long enough for stable medians on the large fixture. */
export const BENCH_OPTIONS: BenchOptions = {
  time: Number(process.env.BENCH_TIME ?? 2000),
  warmupTime: Number(process.env.BENCH_WARMUP ?? 500),
};

function formatMs(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

/**
 * Prints one line per task: median and median absolute deviation, mean with
 * its relative margin of error (95%), p99 and the sample count. Times in ms.
 */
export function printResults(bench: Bench): void {
  const rows: Record<string, string | number>[] = [];
  for (const task of bench.tasks) {
    const result = task.result;
    if (result.state !== 'completed') {
      rows.push({ task: task.name, state: result.state });
      continue;
    }
    const latency = result.latency;
    rows.push({
      task: task.name,
      'median (ms)': formatMs(latency.p50),
      'MAD (ms)': formatMs(latency.mad),
      'mean (ms)': formatMs(latency.mean),
      'rme (%)': latency.rme.toFixed(2),
      'p99 (ms)': formatMs(latency.p99),
      samples: latency.samplesCount,
    });
  }
  console.table(rows);
}
