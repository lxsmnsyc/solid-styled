import type * as babel from '@babel/core';

export default function getRootStatementPath(
  path: babel.NodePath,
): babel.NodePath {
  let current = path.parentPath;
  while (current) {
    const next = current.parentPath;
    if (next && next.type === 'Program') {
      return current;
    }
    current = next;
  }
  return path;
}
