# Source Constraints (Stage 1)

## Project Discovery

- Only scan: `src/**/index.{ts,tsx,js,jsx}`.
- One project per directory.
- Nested project directories are rejected.

## Project Types

- Script project:
  - Required: `index.ts` / `index.tsx` / `index.js` / `index.jsx`
  - Output: `index.js`
- Frontend project:
  - Required: entry script + `index.html`
  - Output: `index.html` (JS/CSS inlined)

## Unsupported in Stage 1

- `.vue` files in project source
- watch/sync command chain
- schema auto dump integration
- legacy Webpack loader behaviors (`remark-loader`, `yaml-loader`, custom obfuscation path)

## Import Rules

- Supported:
  - Relative imports
  - Alias imports: `@/` and `@util/`
  - Standard npm package imports that Vite can bundle
  - `?raw` for text/html style raw import when needed
- Not guaranteed:
  - Legacy externals to global/CDN behavior from old Webpack config

## Output Contract

- Each project directory must produce exactly one primary artifact.
- Extra chunks/assets are treated as build contract violation and should fail validation.
