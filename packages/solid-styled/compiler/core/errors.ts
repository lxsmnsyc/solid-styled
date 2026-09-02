import type { Node } from './ast';

/** A compile failure carrying the source position it was raised at. */
export class CompileError extends Error {
  line: number;
  column: number;

  constructor(message: string, code: string, offset: number) {
    const before = code.slice(0, offset);
    const line = before.split('\n').length;
    const column = offset - (before.lastIndexOf('\n') + 1);
    super(`${message} (${line}:${column})`);
    this.name = 'CompileError';
    this.line = line;
    this.column = column;
  }
}

export function compileError(code: string, node: Node, message: string): never {
  throw new CompileError(message, code, node.start);
}
