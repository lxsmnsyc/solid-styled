# Outcome: fix-error-column

## Built

- `CompileError.column` is 1-based (`compiler/core/errors.ts`). The message prints `(line:column)` with both 1-based. Merged in #53.
- Tests in `test/output.test.ts` check `.column` and the message for an error on line 1 and on a later line.
- Changeset `fix-error-column.md` (patch).

## Proof

On `1.0` at `9bde903` the new assertions failed with `expected 6 to be 7` and `expected 8 to be 9`. They pass on the branch.

## Gotchas

- #49 did not close on merge, because `1.0` is not the default branch. Close it when `next.2` ships.
