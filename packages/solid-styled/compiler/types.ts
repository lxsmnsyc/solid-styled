import type MagicString from 'magic-string';

export interface SolidStyledOptions {
  /** Puts the owning component's name into the generated scope id. */
  verbose?: boolean;
  /** Replaces the default `c-` / `v-` prefixes of generated ids. */
  prefix?: string;
  /** Build mode; forwarded by the bundler plugins. */
  env?: 'development' | 'production';
  /** Browserslist query used by lightningcss when lowering the sheet. */
  browserslist?: string;
}

export interface CompileOutput {
  code: string;
  map: ReturnType<MagicString['generateMap']>;
}
