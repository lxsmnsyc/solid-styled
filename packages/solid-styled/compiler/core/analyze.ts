import { type Node, eachChild, isFunctionNode, isStatementNode } from './ast';
import { SOLID_STYLED_NS, SOURCE_MODULE, USE_ATTRIBUTE } from './constants';

export interface StyleTask {
  kind: 'style';
  /** The `<style jsx>` element, removed wholesale by the transform. */
  element: Node;
  isGlobal: boolean;
  /** Template literals held by the element's expression containers. */
  templates: Node[];
  fn: Node;
  /** Nearest enclosing statement; setup calls are inserted before it. */
  statement: Node;
  /** Top-level statement; hoisted `const` declarations go before it. */
  root: Node;
}

export interface CssTask {
  kind: 'css';
  /** The `css` tagged template expression, replaced in place. */
  expression: Node;
  template: Node;
  fn: Node;
  root: Node;
}

export type TemplateTask = StyleTask | CssTask;

export interface ElementRecord {
  element: Node;
  /** Enclosing function chain, outermost first. */
  functions: Node[];
  /** True when the element carries `use:solid-styled`. */
  hasUseAttribute: boolean;
  /** The node that holds the element, to tell a JSX child from an expression. */
  parent: Node | undefined;
}

export interface Analysis {
  /** Every identifier-ish name in the file; the basis for unique-name generation. */
  names: Set<string>;
  /** Templates in document order, so generated ids stay stable. */
  tasks: TemplateTask[];
  elements: ElementRecord[];
  /** `use:solid-styled` attributes, stripped after scoping. */
  useAttributes: Node[];
  /** Ancestor chain per function node, outermost first; used for verbose names. */
  ancestorsOf: Map<Node, Node[]>;
}

function isUseAttributeName(name: Node): boolean {
  return (
    name.type === 'JSXNamespacedName' &&
    name.namespace.name === 'use' &&
    name.name.name === USE_ATTRIBUTE
  );
}

export function isUseAttribute(attr: Node): boolean {
  return attr.type === 'JSXAttribute' && isUseAttributeName(attr.name);
}

/** Reads the `s:<scope>` marker already present on an opening element. */
export function hasScopedAttribute(opening: Node, scope: string): boolean {
  for (const attr of opening.attributes) {
    if (
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXNamespacedName' &&
      attr.name.namespace.name === SOLID_STYLED_NS &&
      attr.name.name.name === scope
    ) {
      return true;
    }
  }
  return false;
}

function declarePattern(node: Node | null, names: Set<string>): void {
  if (!node) {
    return;
  }
  switch (node.type) {
    case 'Identifier':
      names.add(node.name);
      break;
    case 'ObjectPattern':
      for (const prop of node.properties) {
        declarePattern(prop.type === 'RestElement' ? prop.argument : prop.value, names);
      }
      break;
    case 'ArrayPattern':
      for (const element of node.elements) {
        declarePattern(element, names);
      }
      break;
    case 'AssignmentPattern':
      declarePattern(node.left, names);
      break;
    case 'RestElement':
      declarePattern(node.argument, names);
      break;
    case 'TSParameterProperty':
      // `constructor(private css)` binds `css` as a parameter.
      declarePattern(node.parameter, names);
      break;
    default:
      break;
  }
}

/** Declares the bindings a statement list introduces into its own scope. */
function hoistStatements(body: Node[], names: Set<string>): void {
  for (const statement of body) {
    switch (statement.type) {
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        if (statement.id) {
          names.add(statement.id.name);
        }
        break;
      case 'TSEnumDeclaration':
        // `enum` and `const enum` create a value binding. Types and interfaces do not.
        names.add(statement.id.name);
        break;
      case 'TSImportEqualsDeclaration':
        // `import type css = M.x` has no runtime binding.
        if (statement.importKind !== 'type') {
          names.add(statement.id.name);
        }
        break;
      case 'VariableDeclaration':
        for (const declarator of statement.declarations) {
          declarePattern(declarator.id, names);
        }
        break;
      case 'ExportNamedDeclaration':
      case 'ExportDefaultDeclaration':
        if (statement.declaration) {
          hoistStatements([statement.declaration], names);
        }
        break;
      default:
        break;
    }
  }
}

/**
 * Declares every `var` binding in a statement list, including those in nested
 * blocks, loops, `switch` cases and `try` blocks. It does not enter functions
 * or classes, since a `var` inside them stays inside them.
 */
function hoistVars(body: Node[], names: Set<string>): void {
  for (const statement of body) {
    hoistVarsInStatement(statement, names);
  }
}

function hoistVarsInStatement(statement: Node | null, names: Set<string>): void {
  if (!statement) {
    return;
  }
  switch (statement.type) {
    case 'VariableDeclaration':
      if (statement.kind === 'var') {
        for (const declarator of statement.declarations) {
          declarePattern(declarator.id, names);
        }
      }
      break;
    case 'BlockStatement':
      hoistVars(statement.body, names);
      break;
    case 'IfStatement':
      hoistVarsInStatement(statement.consequent, names);
      hoistVarsInStatement(statement.alternate, names);
      break;
    case 'ForStatement':
      hoistVarsInStatement(statement.init, names);
      hoistVarsInStatement(statement.body, names);
      break;
    case 'ForInStatement':
    case 'ForOfStatement':
      hoistVarsInStatement(statement.left, names);
      hoistVarsInStatement(statement.body, names);
      break;
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'LabeledStatement':
    case 'WithStatement':
      hoistVarsInStatement(statement.body, names);
      break;
    case 'TryStatement':
      hoistVarsInStatement(statement.block, names);
      hoistVarsInStatement(statement.handler?.body, names);
      hoistVarsInStatement(statement.finalizer, names);
      break;
    case 'SwitchStatement':
      for (const clause of statement.cases) {
        hoistVars(clause.consequent, names);
      }
      break;
    case 'ExportNamedDeclaration':
      hoistVarsInStatement(statement.declaration, names);
      break;
    default:
      break;
  }
}

function isStyleJSXElement(element: Node): boolean {
  const opening = element.openingElement;
  return (
    opening.name.type === 'JSXIdentifier' &&
    opening.name.name === 'style' &&
    opening.attributes.some(
      (attr: Node) =>
        attr.type === 'JSXAttribute' &&
        attr.name.type === 'JSXIdentifier' &&
        attr.name.name === 'jsx',
    )
  );
}

function isGlobalStyleElement(element: Node): boolean {
  return element.openingElement.attributes.some(
    (attr: Node) =>
      attr.type === 'JSXAttribute' &&
      attr.name.type === 'JSXIdentifier' &&
      attr.name.name === 'global',
  );
}

/**
 * Single document-order walk that collects everything the transform needs:
 * the `css` and `<style jsx>` templates, every JSX element with its enclosing
 * function chain, the `use:solid-styled` attributes, and the file's name set.
 *
 * Scope tracking is deliberately minimal — it exists only to tell whether the
 * `css` tag still refers to the `solid-styled` import at the point of use.
 */
export function analyze(program: Node): Analysis {
  const analysis: Analysis = {
    names: new Set(),
    tasks: [],
    elements: [],
    useAttributes: [],
    ancestorsOf: new Map(),
  };

  // Module-level locals bound to `css` and to `import * as ns`.
  const cssLocals = new Set<string>();
  const namespaceLocals = new Set<string>();
  const moduleNames = new Set<string>();

  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration' || statement.source.value !== SOURCE_MODULE) {
      continue;
    }
    // `import type { ... }` has no runtime binding.
    if (statement.importKind === 'type') {
      continue;
    }
    for (const specifier of statement.specifiers) {
      // `import { type css }` has no runtime binding either.
      if (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type') {
        continue;
      }
      if (specifier.type === 'ImportSpecifier') {
        const imported =
          specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : specifier.imported.value;
        if (imported === 'css') {
          cssLocals.add(specifier.local.name);
        }
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        namespaceLocals.add(specifier.local.name);
      }
    }
  }

  hoistStatements(program.body, moduleNames);
  hoistVars(program.body, moduleNames);

  const scopes: Set<string>[] = [];
  const fnStack: Node[] = [];
  const parents: Node[] = [];
  let statement: Node | null = null;
  let root: Node | null = null;

  function isShadowed(name: string): boolean {
    for (const scope of scopes) {
      if (scope.has(name)) {
        return true;
      }
    }
    return moduleNames.has(name);
  }

  /** True when the tag still resolves to `css` from `solid-styled`. */
  function isCssTag(tag: Node): boolean {
    if (tag.type === 'Identifier') {
      return cssLocals.has(tag.name) && !isShadowed(tag.name);
    }
    if (tag.type === 'MemberExpression' && !tag.computed) {
      const object = tag.object;
      const property = tag.property;
      return (
        object.type === 'Identifier' &&
        namespaceLocals.has(object.name) &&
        !isShadowed(object.name) &&
        property.type === 'Identifier' &&
        property.name === 'css'
      );
    }
    return false;
  }

  function enterScope(node: Node): Set<string> | null {
    const names = new Set<string>();
    switch (node.type) {
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        if (node.id) {
          names.add(node.id.name);
        }
        for (const param of node.params) {
          declarePattern(param, names);
        }
        // `var` anywhere in the body is visible in the whole function.
        if (node.body.type === 'BlockStatement') {
          hoistVars(node.body.body, names);
        }
        break;
      case 'StaticBlock':
        // A static block is its own `var` scope.
        hoistVars(node.body, names);
        hoistStatements(node.body, names);
        break;
      case 'BlockStatement':
        hoistStatements(node.body, names);
        break;
      case 'TSModuleBlock':
        // A namespace body is its own `var` scope.
        hoistVars(node.body, names);
        hoistStatements(node.body, names);
        break;
      case 'SwitchStatement':
        // Declarations in any `case` are visible in the whole switch body.
        for (const clause of node.cases) {
          hoistStatements(clause.consequent, names);
        }
        break;
      case 'ClassExpression':
        // A class expression name is visible only inside the class.
        if (node.id) {
          names.add(node.id.name);
        }
        break;
      case 'ForStatement':
        if (node.init?.type === 'VariableDeclaration') {
          hoistStatements([node.init], names);
        }
        break;
      case 'ForInStatement':
      case 'ForOfStatement':
        if (node.left.type === 'VariableDeclaration') {
          hoistStatements([node.left], names);
        } else {
          declarePattern(node.left, names);
        }
        break;
      case 'CatchClause':
        declarePattern(node.param, names);
        break;
      default:
        return null;
    }
    scopes.push(names);
    return names;
  }

  function templatesOf(element: Node): Node[] {
    const templates: Node[] = [];
    for (const child of element.children) {
      if (child.type === 'JSXExpressionContainer' && child.expression.type === 'TemplateLiteral') {
        templates.push(child.expression);
      }
    }
    return templates;
  }

  function walk(node: Node): void {
    if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
      analysis.names.add(node.name);
    }

    const scope = enterScope(node);
    if (isFunctionNode(node)) {
      analysis.ancestorsOf.set(node, parents.slice());
      fnStack.push(node);
    }

    const previousStatement = statement;
    if (isStatementNode(node)) {
      statement = node;
    }

    let handled = false;

    if (node.type === 'JSXElement') {
      const fn = fnStack[fnStack.length - 1];
      if (isStyleJSXElement(node)) {
        if (fn && statement && root) {
          analysis.tasks.push({
            kind: 'style',
            element: node,
            isGlobal: isGlobalStyleElement(node),
            templates: templatesOf(node),
            fn,
            statement,
            root,
          });
          // The element is removed wholesale; never edit inside it.
          handled = true;
        }
      } else {
        let hasUseAttribute = false;
        for (const attr of node.openingElement.attributes) {
          if (isUseAttribute(attr)) {
            hasUseAttribute = true;
            analysis.useAttributes.push(attr);
          }
        }
        analysis.elements.push({
          element: node,
          functions: fnStack.slice(),
          hasUseAttribute,
          parent: parents[parents.length - 1],
        });
      }
    } else if (
      node.type === 'TaggedTemplateExpression' &&
      parents[parents.length - 1]?.type === 'ExpressionStatement' &&
      isCssTag(node.tag)
    ) {
      const fn = fnStack[fnStack.length - 1];
      if (fn && root) {
        analysis.tasks.push({
          kind: 'css',
          expression: node,
          template: node.quasi,
          fn,
          root,
        });
      }
    }

    if (!handled) {
      parents.push(node);
      eachChild(node, walk);
      parents.pop();
    }

    statement = previousStatement;
    if (isFunctionNode(node)) {
      fnStack.pop();
    }
    if (scope) {
      scopes.pop();
    }
  }

  parents.push(program);
  for (const topLevel of program.body) {
    root = topLevel;
    walk(topLevel);
  }
  parents.pop();

  return analysis;
}
