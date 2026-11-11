/**
 * Serves the prerendered site in `dist/client` as a static host would: a
 * directory answers with its `index.html`, and anything missing gets
 * `404.html`. No server rendering happens here.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../dist/client');
const PORT = Number(process.env.PORT ?? 4173);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

/** Finds the file a static host would serve for a URL path. */
function resolveFile(pathname: string): string | undefined {
  const target = path.join(ROOT, path.normalize(decodeURIComponent(pathname)));
  if (!target.startsWith(ROOT)) {
    return undefined;
  }
  if (existsSync(target) && statSync(target).isFile()) {
    return target;
  }
  const index = path.join(target, 'index.html');
  return existsSync(index) ? index : undefined;
}

if (!existsSync(ROOT)) {
  console.error('No build found. Run `pnpm --filter website build` first.');
  process.exit(1);
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');

  // `/docs/setup` redirects to `/docs/setup/`, so relative links resolve.
  const file = resolveFile(pathname);
  if (file?.endsWith('index.html') && !pathname.endsWith('/')) {
    response.writeHead(301, { Location: `${pathname}/` });
    response.end();
    return;
  }

  const served = file ?? path.join(ROOT, '404.html');
  response.writeHead(file ? 200 : 404, {
    'Content-Type': TYPES[path.extname(served)] ?? 'application/octet-stream',
  });
  createReadStream(served).pipe(response);
}).listen(PORT, () => {
  console.log(`Serving ${path.relative(process.cwd(), ROOT)} at http://localhost:${PORT}/`);
});
