# Acceptance Checklist (Current)

## Functional

- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds
- [ ] `pnpm build:dev` succeeds
- [ ] script project outputs exactly `dist/<project>/index.js`
- [ ] frontend project outputs exactly `dist/<project>/index.html`

## Contract

- [ ] project discovery only includes `src/`
- [ ] `.vue` file in `src` causes explicit build failure
- [ ] nested project dirs in `src` cause explicit build failure
- [ ] script bare-package imports are rewritten to CDN ESM URLs
- [ ] script local/alias imports stay bundled in the single-file output

## Migration

- [ ] no active build script depends on Webpack
- [ ] no core util depends on Vue/Pinia APIs
- [ ] migration docs under `agents/migration/` stay updated

## Release Readiness

- [ ] CI bundle workflow uses stage-1 build contract
- [ ] README reflects current commands and limits
