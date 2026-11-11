import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import MarkdownIt from 'markdown-it';
import type { Highlighter } from 'shiki';
import { createHighlighter } from 'shiki';
import { compile } from 'solid-styled/compiler';
import type { Plugin, ViteDevServer } from 'vite';
import type { CompiledSample, DocPage, SiteContent, TocEntry } from '../src/content-types.ts';
import { darkTheme, lightTheme } from './themes.ts';

type Markdown = InstanceType<typeof MarkdownIt>;

const VIRTUAL_ID = 'virtual:site-content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const WEBSITE_DIR = path.resolve(import.meta.dirname, '..');
const REPO_DIR = path.resolve(WEBSITE_DIR, '..');
const DOCS_DIR = path.join(REPO_DIR, 'docs');
const SNIPPETS_DIR = path.join(WEBSITE_DIR, 'snippets');
const DEMOS_DIR = path.join(WEBSITE_DIR, 'src/demos');
const RIBBONS_FILE = path.join(WEBSITE_DIR, 'src/islands/Ribbons.tsx');
const GLOBAL_STYLES_FILE = path.join(WEBSITE_DIR, 'src/components/GlobalStyles.tsx');
const RUNTIME_FILE = path.join(REPO_DIR, 'packages/solid-styled/dist/index.js');
const PACKAGE_FILE = path.join(REPO_DIR, 'packages/solid-styled/package.json');

/** The guides in reading order. The order matches the README. */
export const DOC_SLUGS = [
  'getting-started',
  'styling',
  'scoping',
  'ssr',
  'component-libraries',
  'configuration',
  'editor',
  'migrating-from-0.x',
  'how-it-works',
  'api',
  'known-limits',
];

/** Fonts served from `/fonts/`, copied out of the @fontsource packages. */
const FONTS: Record<string, string> = {
  'geist-latin.woff2': '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
  'jetbrains-mono-latin.woff2':
    '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
};

const LANGS = ['tsx', 'jsx', 'ts', 'js', 'jsonc', 'json', 'bash', 'css'];

const LANG_ALIASES: Record<string, string | undefined> = {
  sh: 'bash',
  shell: 'bash',
  typescript: 'ts',
  javascript: 'js',
};

let highlighterPromise: Promise<Highlighter> | undefined;

async function loadHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [darkTheme, lightTheme],
    langs: LANGS,
  });
  return highlighterPromise;
}

/** Highlights code with both site themes, as CSS variables the page switches between. */
export function highlight(highlighter: Highlighter, code: string, lang: string): string {
  const resolved = LANG_ALIASES[lang] ?? lang;
  return highlighter.codeToHtml(code.replace(/\n$/, ''), {
    lang: LANGS.includes(resolved) ? resolved : 'text',
    themes: { dark: darkTheme.name, light: lightTheme.name },
    defaultColor: false,
  });
}

/** Turns a heading into the same anchor id GitHub gives it. */
function createSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

/** Points a link between guides at the matching site route. */
function rewriteDocLink(href: string): string {
  const match = /^(?:\.\/)?([\w-]+)\.md(#.*)?$/.exec(href);
  if (match && DOC_SLUGS.includes(match[1])) {
    return `/docs/${match[1]}/${match.at(2) ?? ''}`;
  }
  return href;
}

function createMarkdown(highlighter: Highlighter): Markdown {
  const md: Markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });

  // Headings get GitHub-style ids and link to themselves.
  md.renderer.rules.heading_open = (tokens, index, options, _env, self): string => {
    const token = tokens[index];
    const id = token.attrGet('id');
    const open = self.renderToken(tokens, index, options);
    return id ? `${open}<a class="anchor" href="#${id}">` : open;
  };
  md.renderer.rules.heading_close = (tokens, index, options, _env, self): string => {
    const open = tokens[index - 2];
    const close = self.renderToken(tokens, index, options);
    return open.attrGet('id') ? `</a>${close}` : close;
  };

  // Code blocks are highlighted at build time; the page ships no highlighter.
  md.renderer.rules.fence = (tokens, index): string => {
    const token = tokens[index];
    const lang = token.info.trim().split(/\s+/)[0] ?? '';
    return `<div data-code>${highlight(highlighter, token.content, lang)}</div>`;
  };

  // Wide tables scroll inside their own box instead of the page.
  md.renderer.rules.table_open = (): string => '<div class="table"><table>';
  md.renderer.rules.table_close = (): string => '</table></div>';

  md.renderer.rules.link_open = (tokens, index, options, _env, self): string => {
    const token = tokens[index];
    const href = token.attrGet('href');
    if (href) {
      token.attrSet('href', rewriteDocLink(String(href)));
    }
    return self.renderToken(tokens, index, options);
  };

  return md;
}

/** Reads the plain text of an inline token, code spans included. */
function readInlineText(token: { children: { type: string; content: string }[] | null }): string {
  let text = '';
  for (const child of token.children ?? []) {
    if (child.type === 'text' || child.type === 'code_inline') {
      text += child.content;
    }
  }
  return text;
}

function renderDoc(md: Markdown, slug: string): DocPage {
  const source = readFileSync(path.join(DOCS_DIR, `${slug}.md`), 'utf8');
  const tokens = md.parse(source, {});
  const toc: TocEntry[] = [];
  let title = slug;
  let body: typeof tokens = [];

  // The level 1 heading becomes the page title, the rest gets ids for the TOC.
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.type !== 'heading_open') {
      continue;
    }
    const text = readInlineText(tokens[i + 1]);
    if (token.tag === 'h1') {
      title = text;
      body = tokens.slice(0, i).concat(tokens.slice(i + 3));
      i += 2;
      continue;
    }
    const id = createSlug(text);
    token.attrSet('id', id);
    toc.push({ id, text, depth: Number(token.tag.slice(1)) });
  }

  // A doc without an h1 keeps every token.
  if (body.length === 0) {
    body = tokens;
  }

  return { slug, title, html: md.renderer.render(body, md.options, {}), toc };
}

/** Pulls the sheet string out of compiled code, as the runtime will receive it. */
function readSheet(code: string): string {
  let sheet = '';
  // The compiler writes each sheet with JSON.stringify.
  for (const match of code.matchAll(/^const css_\d+ = ("(?:[^"\\]|\\.)*");$/gm)) {
    const value: unknown = JSON.parse(match[1]);
    if (typeof value === 'string') {
      sheet += value;
    }
  }
  return sheet;
}

/**
 * Compiles a module with the real compiler. `id` decides the scope hash, so
 * the island passes its real path and its output matches the live DOM.
 */
function compileSample(highlighter: Highlighter, id: string, source: string): CompiledSample {
  const { code } = compile(id, source, {});
  const sheet = readSheet(code);
  return {
    source: highlight(highlighter, source, 'tsx'),
    output: highlight(highlighter, code, 'tsx'),
    sheet,
    sheetHtml: highlight(highlighter, sheet, 'css'),
  };
}

/** Pulls the first fenced code block of a guide, so the page quotes the docs as written. */
function readFirstFence(md: Markdown, slug: string): { content: string; lang: string } {
  const source = readFileSync(path.join(DOCS_DIR, `${slug}.md`), 'utf8');
  for (const token of md.parse(source, {})) {
    if (token.type === 'fence') {
      return { content: token.content, lang: token.info.trim() };
    }
  }
  return { content: '', lang: 'text' };
}

function readVersion(): string {
  const manifest: unknown = JSON.parse(readFileSync(PACKAGE_FILE, 'utf8'));
  if (
    typeof manifest === 'object' &&
    manifest !== null &&
    'version' in manifest &&
    typeof manifest.version === 'string'
  ) {
    return manifest.version;
  }
  throw new Error(`[website] ${PACKAGE_FILE} has no version`);
}

async function buildContent(): Promise<SiteContent> {
  const highlighter = await loadHighlighter();
  const md = createMarkdown(highlighter);

  // Guides, in README order.
  const docs: DocPage[] = [];
  for (const slug of DOC_SLUGS) {
    docs.push(renderDoc(md, slug));
  }

  // The two spellings compile under the same id, so they share a scope hash.
  const samples = {
    css: compileSample(
      highlighter,
      'src/Button.tsx',
      readFileSync(path.join(SNIPPETS_DIR, 'button-css.tsx'), 'utf8'),
    ),
    styleJsx: compileSample(
      highlighter,
      'src/Button.tsx',
      readFileSync(path.join(SNIPPETS_DIR, 'button-style-jsx.tsx'), 'utf8'),
    ),
    ribbons: compileSample(highlighter, RIBBONS_FILE, readFileSync(RIBBONS_FILE, 'utf8')),
  };

  // Demo components are shown as they are written.
  const sources: Record<string, string> = {};
  for (const file of readdirSync(DEMOS_DIR)) {
    sources[file] = highlight(highlighter, readFileSync(path.join(DEMOS_DIR, file), 'utf8'), 'tsx');
  }

  const ssr = readFirstFence(md, 'ssr');
  const snippets: Record<string, string> = {
    ssr: highlight(highlighter, ssr.content, ssr.lang),
    bundlers: highlight(
      highlighter,
      [
        "import solidStyled from 'unplugin-solid-styled';",
        '',
        'solidStyled.vite(options);',
        'solidStyled.rollup(options);',
        'solidStyled.webpack(options);',
        'solidStyled.esbuild(options);',
      ].join('\n'),
      'js',
    ),
  };

  const globalSheet = readSheet(
    compile(GLOBAL_STYLES_FILE, readFileSync(GLOBAL_STYLES_FILE, 'utf8'), {}).code,
  );

  return {
    docs,
    samples,
    sources,
    snippets,
    stats: {
      version: readVersion(),
      runtimeGzip: gzipSync(readFileSync(RUNTIME_FILE)).byteLength,
      globalSheetBytes: Buffer.byteLength(globalSheet),
    },
  };
}

/** Files the content module reads, watched so dev reloads on edits. */
function listContentFiles(): string[] {
  const files: string[] = [RIBBONS_FILE, GLOBAL_STYLES_FILE];
  for (const slug of DOC_SLUGS) {
    files.push(path.join(DOCS_DIR, `${slug}.md`));
  }
  for (const file of readdirSync(SNIPPETS_DIR)) {
    files.push(path.join(SNIPPETS_DIR, file));
  }
  for (const file of readdirSync(DEMOS_DIR)) {
    files.push(path.join(DEMOS_DIR, file));
  }
  return files;
}

function resolveFont(name: string): string | undefined {
  const spec = FONTS[name];
  return spec ? path.join(WEBSITE_DIR, 'node_modules', spec) : undefined;
}

/**
 * Serves `virtual:site-content`: the guides from `docs/` rendered to HTML,
 * code samples compiled by `solid-styled/compiler`, and a few measured
 * numbers. Only server code imports it, so none of it reaches the client.
 */
function contentPlugin(): Plugin {
  let server: ViteDevServer | undefined;
  const watched = new Set(listContentFiles());

  return {
    name: 'website:content',
    configureServer(devServer): void {
      server = devServer;
      devServer.watcher.add([...watched]);
      devServer.watcher.on('change', (file) => {
        if (!watched.has(path.resolve(file))) {
          return;
        }
        // Drop the cached module in every environment, then reload the page.
        for (const environment of Object.values(devServer.environments)) {
          const node = environment.moduleGraph.getModuleById(RESOLVED_ID);
          if (node) {
            environment.moduleGraph.invalidateModule(node);
          }
        }
        devServer.ws.send({ type: 'full-reload' });
      });
    },
    resolveId(id): string | undefined {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    async load(id): Promise<string | undefined> {
      if (id !== RESOLVED_ID) {
        return undefined;
      }
      if (!server) {
        for (const file of watched) {
          this.addWatchFile(file);
        }
      }
      const content = await buildContent();
      return `export default ${JSON.stringify(content)};`;
    },
  };
}

/** Serves the font files in dev and writes them to `dist/client/fonts` in the build. */
function fontsPlugin(): Plugin {
  return {
    name: 'website:fonts',
    configureServer(server): void {
      server.middlewares.use((req, res, next) => {
        const match = /^\/fonts\/([\w.-]+)$/.exec(req.url ?? '');
        const file = match ? resolveFont(match[1]) : undefined;
        if (!file) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'font/woff2');
        res.end(readFileSync(file));
      });
    },
    generateBundle(): void {
      if (this.environment.name !== 'client') {
        return;
      }
      for (const name of Object.keys(FONTS)) {
        this.emitFile({
          type: 'asset',
          fileName: `fonts/${name}`,
          source: readFileSync(resolveFont(name)!),
        });
      }
    },
  };
}

/** Every page the site has, as URL paths. */
export function listRoutes(): string[] {
  const routes = ['/', '/docs/'];
  for (const slug of DOC_SLUGS) {
    routes.push(`/docs/${slug}/`);
  }
  routes.push('/404');
  return routes;
}

interface ServerHandler {
  handleRequest(request: Request): Promise<Response>;
}

/** Checks the built server bundle has the handler the plugin documents. */
function isServerHandler(value: unknown): value is ServerHandler {
  return (
    typeof value === 'object' &&
    value !== null &&
    'handleRequest' in value &&
    typeof value.handleRequest === 'function'
  );
}

/** Maps a route to the file a static host serves for it. */
function getRouteFile(route: string): string {
  if (route === '/404') {
    return '404.html';
  }
  return path.join(route.slice(1), 'index.html');
}

/**
 * Prerenders every route through the built server handler, the same way the
 * plugin prerenders the client-mode shell, then drops the server bundle so
 * `dist/client` is a plain static site.
 */
function prerenderPlugin(): Plugin {
  return {
    name: 'website:prerender',
    apply: 'build',
    buildApp: {
      order: 'post',
      async handler(builder): Promise<void> {
        const { client, ssr } = builder.environments;
        if (!client.isBuilt) {
          await builder.build(client);
        }
        if (!ssr.isBuilt) {
          await builder.build(ssr);
        }

        const clientDir = path.resolve(builder.config.root, client.config.build.outDir);
        const serverDir = path.resolve(builder.config.root, ssr.config.build.outDir);
        const handler: unknown = await import(
          pathToFileURL(path.join(serverDir, 'server.js')).href
        );
        if (!isServerHandler(handler)) {
          throw new Error('[website] dist/server/server.js has no handleRequest export');
        }

        // A failed page fails the build, so a broken route never ships as a blank file.
        for (const route of listRoutes()) {
          const response = await handler.handleRequest(
            new Request(new URL(route, 'http://localhost')),
          );
          const html = await response.text();
          if (!html.includes('</html>')) {
            throw new Error(`[website] prerendering ${route} failed with ${response.status}`);
          }
          const file = path.join(clientDir, getRouteFile(route));
          mkdirSync(path.dirname(file), { recursive: true });
          writeFileSync(file, html);
          builder.config.logger.info(
            `prerendered ${route} -> ${path.relative(builder.config.root, file)}`,
          );
        }

        rmSync(serverDir, { recursive: true, force: true });
      },
    },
  };
}

export default function site(): Plugin[] {
  return [contentPlugin(), fontsPlugin(), prerenderPlugin()];
}
