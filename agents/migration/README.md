# Migration Design (Webpack -> Vite, Vue -> React)

## Goal

- Replace Webpack with a Vite-based build pipeline.
- Keep only core build capability in stage 1.
- Move core UI/runtime helper APIs from Vue ecosystem to React ecosystem.

## Confirmed Scope (Stage 1)

- Include:
  - Build command only: `pnpm build`, `pnpm build:dev`
  - Source scope: `src/**/index.{ts,tsx,js,jsx}`
  - Output contract: one distributable file per project directory
    - script project: `dist/<project>/index.js`
    - frontend project (has `index.html`): `dist/<project>/index.html`
  - Core utility migration:
    - `util/streaming.ts` -> React context/root mounting
    - `util/mvu.ts` -> Zustand store
- Exclude:
  - watch/sync workflow
  - schema auto-dump
  - example/template migration
  - Vue SFC support

## Current Implementation Status

- [x] Vite build entry script added: `scripts/build.mjs`
- [x] Package scripts switched to Vite build entry
- [x] `util/streaming.ts` migrated to React context/root
- [x] `util/mvu.ts` migrated to Zustand
- [ ] CI workflows fully simplified for stage-1 contract
- [ ] README fully aligned with new architecture

## Notes

- Stage 1 intentionally applies stricter constraints to keep migration stable.
- Stage 2 can re-introduce optional capabilities (watch/sync, richer loader support) after build core is stable.
