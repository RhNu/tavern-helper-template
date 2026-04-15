# Build Architecture (Current)

## Build Entry

- Script: `scripts/build.mjs`
- Commands:
  - `pnpm build` -> production mode
  - `pnpm build:dev` -> development mode

## Pipeline

1. Discover projects from `src/**/index.{ts,tsx,js,jsx}`.
2. Validate constraints:
   - no nested project folders
   - no `.vue` files
3. Build each project sequentially via Vite Node API.
4. Validate output against single-file contract.

## Vite Strategy

- Script project:
  - Vite library build (ESM)
  - `inlineDynamicImports` enabled
  - Output fixed to `index.js`
  - Bare package imports are externalized to CDN ESM URLs
  - Local/alias/http/data imports remain bundled in project output
  - Package requests containing `react` or `pixi` are force-inlined
- Frontend project:
  - Vite HTML build
  - `vite-plugin-singlefile` inlines JS/CSS
  - Output fixed to `index.html`

## Aliases

- `@util/` -> `util/`
- `@/` -> `src/`

## Runtime Utility Migration

- `util/streaming.ts`
  - old: Vue app + provide/inject
  - new: React root + Context
- `util/mvu.ts`
  - old: Pinia + VueUse watchers
  - new: Zustand + selector subscription + polling sync

## Deferred Items

- watch server and sync subprocess integration
- schema generation hook in build
- full parity of legacy Webpack loader/obfuscation behaviors
