# Figma Auto Sync

This repository now includes two scripts:

- `npm run figma:sync` — pulls exported assets from specific Figma node IDs into `src/assets/figma/` and regenerates `src/assets/figma/generated.ts`.
- `npm run figma:push` — posts an update comment back to the target Figma file (useful for CI/deploy notifications).

## Required environment variables

- `FIGMA_ACCESS_TOKEN`: Figma personal access token.
- `FIGMA_FILE_KEY`: Figma file key (`https://www.figma.com/file/<FILE_KEY>/...`).
- `FIGMA_COMPONENT_NODE_IDS`: Comma-separated node IDs to export (for `figma:sync`).

## Optional environment variables

- `FIGMA_EXPORT_FORMAT` (default: `png`)
- `FIGMA_EXPORT_SCALE` (default: `2`)
- `FIGMA_PUSH_MESSAGE` (default: auto-generated from `VERCEL_URL` when available)
- `FIGMA_COMMENT_X` / `FIGMA_COMMENT_Y` (default: `0`, `0`)

## Usage

```bash
npm run figma:sync
npm run figma:push
# or
npm run figma:auto-sync
```

## Notes

- Figma's REST API supports pulling assets and posting comments. Full design "write back" from code requires plugin/plugin-API workflows.
- `figma:push` is implemented as a file comment update so deployments can notify designers directly in Figma.
