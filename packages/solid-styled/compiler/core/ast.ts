export interface Node {
  type: string;
  start: number;
  end: number;
  // The compiler walks a structural AST; property access is untyped by design.
  [key: string]: any;
}

/** Keys that hold TypeScript type-space nodes; never traversed. */
const TYPE_KEYS = new Set([
  'typeAnnotation',
  'typeArguments',
  'typeParameters',
  'returnType',
  'superTypeArguments',
  'implements',
]);

function isNode(value: unknown): value is Node {
  return value != null && typeof value === 'object' && typeof (value as Node).type === 'string';
}

/** Invokes `cb` for every direct child node, skipping TypeScript type-space keys. */
export function eachChild(node: Node, cb: (child: Node) => void): void {
  for (const key of Object.keys(node)) {
    if (TYPE_KEYS.has(key)) {
      continue;
    }
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isNode(item)) {
          cb(item);
        }
      }
    } else if (isNode(value)) {
      cb(value);
    }
  }
}

const EXPRESSION_WRAPPERS = new Set([
  'ParenthesizedExpression',
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
  'TSInstantiationExpression',
]);

/** Peels parentheses and TypeScript expression wrappers. */
export function unwrap(node: Node | null | undefined): Node | null {
  let current = node ?? null;
  while (current && EXPRESSION_WRAPPERS.has(current.type)) {
    current = current.expression;
  }
  return current;
}

export const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** True for any function-like node that can own a scoped sheet. */
export function isFunctionNode(node: Node | null | undefined): boolean {
  return node != null && FUNCTION_TYPES.has(node.type);
}

const STATEMENT_SUFFIX = /Statement$|Declaration$/;

/** True when the node occupies a statement position. */
export function isStatementNode(node: Node): boolean {
  return STATEMENT_SUFFIX.test(node.type);
}

/** Source text of a node, verbatim. */
export function textOf(code: string, node: Node): string {
  return code.slice(node.start, node.end);
}

/** Leading whitespace of the line the offset sits on. */
export function indentAt(code: string, offset: number): string {
  let start = offset;
  while (start > 0 && code[start - 1] !== '\n') {
    start--;
  }
  let end = start;
  while (end < offset && (code[end] === ' ' || code[end] === '\t')) {
    end++;
  }
  return code.slice(start, end);
}
