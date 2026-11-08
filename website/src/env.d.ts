/// <reference types="vite/client" />
/// <reference types="solid-styled" />

interface ImportMetaEnv {
  /** Set through `define` in `vite.config.ts`. */
  readonly SITE_URL: string;
}

// An ambient module cannot use a top-level import, so the type is
// referenced inline.
declare module 'virtual:site-content' {
  const content: import('./content-types').SiteContent;
  export default content;
}
