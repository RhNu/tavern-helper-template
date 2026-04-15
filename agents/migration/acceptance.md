# Acceptance Checklist (Stage 1)

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

## Migration

- [ ] no active build script depends on Webpack
- [ ] no core util depends on Vue/Pinia APIs
- [ ] migration docs under `agents/migration/` stay updated

## Release Readiness

- [ ] CI bundle workflow uses stage-1 build contract
- [ ] README reflects current commands and limits
