---
id: website
status: todo
target: main
ship: auto
size: L
gate: false
outline: false
title: Project website
priority: should
type: feature
milestone: 1.0
depends_on:
  - on: docs-issue-answers
    kind: hard
    why: site content comes from docs/
---

# Project website

## Goal

The project has no website. `website/` holds one: a private workspace app on Solid 2.0 and `@solidjs/vite-plugin`, styled with solid-styled itself. It has a landing page, the guides from `docs/` and a live example. Every route is prerendered to static HTML. Deploying to Vercel is left for later.

## What was built

- **Package.** `website/` is a private workspace package, listed in `pnpm-workspace.yaml` and the root `workspaces`. Stack: `solid-js` and `@solidjs/web` 2.0.0-rc.21, `@solidjs/vite-plugin` 3.0.0-next.57, Vite 8, TypeScript, `unplugin-solid-styled` and `solid-styled` from the workspace.
- **Start mode.** `vite.config.ts` runs the plugin as `solid({ ssr: true, start: { renderMode: 'async', devtools: false } })` with authored entries. `src/entry-server.tsx` exports `render(request)`: it renders `<App path>` inside `<StyleRegistry styles>` with `renderToString` and writes `renderSheets(styles)` into `<head>`. `src/entry-client.ts` never hydrates. It adds the theme toggle, copy buttons, tabs, the table of contents highlight and the hero pointer effect, and mounts the playground island with `render()`.
- **Routing.** The plugin has no router. `src/App.tsx` picks the page from the path: `/`, `/docs/`, `/docs/<slug>/` for the six guides, and a 404 page.
- **Prerendering.** The plugin only prerenders the client-mode shell. `plugins/site.ts` adds a `buildApp` hook (`order: 'post'`) that builds both environments, calls `handleRequest` from `dist/server/server.js` for every route, writes `dist/client/**/index.html` and `404.html`, and removes `dist/server`. A page without `</html>` fails the build.
- **Content.** `virtual:site-content`, served by `plugins/site.ts` and imported only by server code, renders `docs/*.md` with markdown-it and shiki at build time (GitHub-style heading ids, TOC, links between guides rewritten to site routes). It compiles `snippets/button-*.tsx` and `src/islands/Ribbons.tsx` with `solid-styled/compiler`, so the shown output is real. It also measures the gzipped runtime and the site's `@global` sheet.
- **Pages.** Landing page: hero with the ribbon S drawn in SVG, install command and links. Section 01 shows the `css` and `<style jsx>` sources next to the compiler output and the shared sheet. Section 02 is the playground: three sliders drive `Ribbons`, and counters show style attribute writes against sheet rewrites (always 0). Section 03 has live scoping demos for the default scope, `:global`, `use:solid-styled` and `@global`. Section 04 covers SSR (with the page's own sheet count), runtime size and bundler entries. Docs: sidebar, table of contents, prev/next and edit links.
- **Design.** Tokens live in one `@global` block in `src/components/GlobalStyles.tsx`, with `light-dark()` for both themes and text pairs checked for WCAG AA. Fonts: JetBrains Mono and Geist, self-hosted from `@fontsource-variable`, preloaded, `font-display: optional`. Favicon `public/favicon.svg`, Open Graph image `public/og.png`.
- **Commands.** `pnpm --filter website dev`, `pnpm --filter website build`, `pnpm --filter website preview` (static server for `dist/client` on port 4173).

## Found while building

- The compiler mangles `unicode-range` (`U+0000-00FF` becomes `U0-0FF`). The site drops `unicode-range`.
- A selector list where every item uses `:global`, such as `.a :global(b), .a :global(c)`, compiles to `[s\:c-…]:is(…)` and matches nothing. The site writes `.a :global(:is(b, c))` instead.
- The `css` tag types its interpolations as `string | boolean`, so `${props.width}px` with a number does not type check, although the README shows it.
