export const REPO_URL = 'https://github.com/lxsmnsyc/solid-styled';
export const NPM_URL = 'https://www.npmjs.com/package/solid-styled';
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const LEGACY_URL = `${REPO_URL}/tree/0.x`;
export const TAGLINE = 'Near zero-runtime, reactive stylesheets for SolidJS';
export const INSTALL = 'npm i solid-styled';

/**
 * The absolute origin the site is deployed at, for Open Graph tags. Set
 * `SITE_URL` when building; without it the tags use root-relative URLs.
 */
export const SITE_URL: string = import.meta.env.SITE_URL;

/** Replaced by the server entry with the number of sheets on the page. */
export const SHEET_COUNT_TOKEN = '%%SHEET_COUNT%%';

/** Strips the trailing slash so `/docs/setup` and `/docs/setup/` match. */
export function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}
