import type { NodePath } from '@babel/core';
import * as t from '@babel/types';
import { isPathValid } from './checks';
import unwrapPath from './unwrap-path';

function pathReferencesImportIdentifier(
  path: NodePath,
  moduleSource: string,
  importName: string,
): boolean {
  const identifier = unwrapPath(path, t.isIdentifier);
  if (!identifier) {
    return false;
  }
  const binding = path.scope.getBinding(identifier.node.name);
  if (!binding || binding.kind !== 'module') {
    return false;
  }
  const importPath = binding.path;
  const importParent = importPath.parentPath;
  if (
    isPathValid(importParent, t.isImportDeclaration) &&
    importParent.node.source.value === moduleSource
  ) {
    if (isPathValid(importPath, t.isImportSpecifier)) {
      const key = t.isIdentifier(importPath.node.imported)
        ? importPath.node.imported.name
        : importPath.node.imported.value;
      return importName === key;
    }
    if (isPathValid(importPath, t.isImportDefaultSpecifier)) {
      return importName === 'default';
    }
    if (isPathValid(importPath, t.isImportNamespaceSpecifier)) {
      return importName === '*';
    }
  }
  return false;
}

function pathReferencesImportMember(
  path: NodePath,
  moduleSource: string,
  importName: string,
): boolean {
  const memberExpr =
    unwrapPath(path, t.isMemberExpression) ||
    unwrapPath(path, t.isOptionalMemberExpression);
  if (memberExpr) {
    const object = unwrapPath(memberExpr.get('object'), t.isIdentifier);
    if (!object) {
      return false;
    }
    const property = memberExpr.get('property');
    if (isPathValid(property, t.isIdentifier)) {
      return (
        importName === property.node.name &&
        pathReferencesImport(object, moduleSource, '*')
      );
    }
    if (isPathValid(property, t.isStringLiteral)) {
      return (
        importName === property.node.value &&
        pathReferencesImport(object, moduleSource, '*')
      );
    }
  }
  return false;
}

export function pathReferencesImport(
  path: NodePath,
  moduleSource: string,
  importName: string,
): boolean {
  return (
    pathReferencesImportIdentifier(path, moduleSource, importName) ||
    pathReferencesImportMember(path, moduleSource, importName)
  );
}
