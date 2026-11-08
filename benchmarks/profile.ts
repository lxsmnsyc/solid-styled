// Compiles one fixture in a loop so `node --cpu-prof` collects enough samples.
// Usage: node --cpu-prof profile.ts [fixture] [iterations]
import { compile } from 'solid-styled/compiler';
import { readFixture } from './shared.ts';

const name = process.argv[2] ?? 'large';
const iterations = Number(process.argv[3] ?? 100);
const { id, code } = readFixture(name);

// Warm up outside the timed loop so JIT tiers settle first.
for (let index = 0; index < 5; index += 1) {
  compile(id, code);
}

const start = performance.now();
for (let index = 0; index < iterations; index += 1) {
  compile(id, code);
}
const elapsed = performance.now() - start;
console.log(`${name}: ${iterations} compiles, ${(elapsed / iterations).toFixed(3)} ms each`);
