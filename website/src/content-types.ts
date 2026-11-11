/** A heading inside a guide, listed in the table of contents. */
export interface TocEntry {
  id: string;
  text: string;
  depth: number;
}

/** A guide from `docs/`, rendered to HTML at build time. */
export interface DocPage {
  slug: string;
  title: string;
  html: string;
  toc: TocEntry[];
}

/** A source module next to what `solid-styled/compiler` turned it into. */
export interface CompiledSample {
  source: string;
  output: string;
  sheet: string;
  /** The sheet, highlighted as CSS. */
  sheetHtml: string;
}

export interface SiteStats {
  /** The `solid-styled` version in the workspace. */
  version: string;
  /** Gzipped size of the published `solid-styled` runtime, in bytes. */
  runtimeGzip: number;
  /** Size of the compiled sheet of the site's own `@global` block, in bytes. */
  globalSheetBytes: number;
}

export interface SiteContent {
  docs: DocPage[];
  samples: {
    css: CompiledSample;
    styleJsx: CompiledSample;
    ribbons: CompiledSample;
  };
  /** Highlighted sources of the demo components, keyed by file name. */
  sources: Record<string, string>;
  /** Highlighted code shown on the landing page, keyed by name. */
  snippets: Record<string, string>;
  stats: SiteStats;
}
