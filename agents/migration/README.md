# Migration Design (Webpack -> Vite, Vue -> React)

## Goal

- Replace Webpack with a Vite-based build pipeline.
- Keep only core build capability in stage 1.
- Move core UI/runtime helper APIs from Vue ecosystem to React ecosystem.

## Confirmed Scope (Current)

- Include:
  - Build command only: `pnpm build`, `pnpm build:dev`
  - Source scope: `src/**/index.{ts,tsx,js,jsx}`
  - Output contract: one distributable file per project directory
    - script project: `dist/<project>/index.js`
    - frontend project (has `index.html`): `dist/<project>/index.html`
  - Core utility migration:
    - `util/streaming.ts` -> React context/root mounting
    - `util/mvu.ts` -> Zustand store
  - Template/example baseline migrated from Vue to React/Zustand
  - Script bare-package imports rewritten to CDN ESM URLs, local/alias imports stay bundled
- Exclude:
  - watch/sync workflow
  - schema auto-dump
  - Vue SFC support

## Current Implementation Status

- [x] Vite build entry script added: `scripts/build.mjs`
- [x] Package scripts switched to Vite build entry
- [x] `util/streaming.ts` migrated to React context/root
- [x] `util/mvu.ts` migrated to Zustand
- [x] Template/example baseline migrated to React counterparts
- [x] Script CDN externalization contract implemented and verified
- [ ] CI workflows fully simplified for stage-1 contract
- [x] README aligned with current architecture notes

## Notes

- Stage 1 intentionally applies stricter constraints to keep migration stable.
- Stage 2 can re-introduce optional capabilities (watch/sync, richer loader support) after build core is stable.
