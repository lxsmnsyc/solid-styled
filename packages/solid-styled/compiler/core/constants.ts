// The module the runtime helpers are imported from.
export const SOURCE_MODULE = 'solid-styled';
// The JSX namespace used for scoping markers, as in `s:c-abc-0`.
export const SOLID_STYLED_NS = 's';
// The opt-in attribute that scopes a component element: `use:solid-styled`.
export const USE_ATTRIBUTE = 'solid-styled';
export const VARS_ID = 'vars';
export const SHEET_ID = 'sheet';
export const GLOBAL_SELECTOR = 'global';

export const RUNTIME_IDENTIFIERS = {
  createCSSVars: 'createCSSVars',
  mergeStyles: 'mergeStyles',
  useSolidStyled: 'useSolidStyled',
  useSolidStyledGlobal: 'useSolidStyledGlobal',
};
