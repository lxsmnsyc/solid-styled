// Checks that oxc-parser's raw transfer gives the same AST as the default
// JSON transfer on every fixture, so switching the compiler to it cannot
// change the output.
import { parseSync, rawTransferSupported } from 'oxc-parser';
import { FIXTURES, readFixture } from '../shared.ts';

const OPTIONS = { lang: 'tsx', sourceType: 'module' } as const;
// `experimentalRawTransfer` is read by oxc-parser's JS wrapper but missing
// from its types, so it is passed through a variable.
const RAW_OPTIONS = { ...OPTIONS, experimentalRawTransfer: true };

console.log(`raw transfer supported: ${rawTransferSupported()}`);
const rows: Record<string, string | number | boolean>[] = [];
for (const name of FIXTURES) {
  const { id, code } = readFixture(name);
  const json = JSON.stringify(parseSync(id, code, OPTIONS).program);
  const raw = JSON.stringify(parseSync(id, code, RAW_OPTIONS).program);
  rows.push({ fixture: name, 'AST JSON (chars)': json.length, 'same AST': json === raw });
}
console.table(rows);
