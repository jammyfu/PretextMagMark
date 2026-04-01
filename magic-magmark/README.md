# MagicMagMark

`magic-magmark/` is a fully isolated app that uses the current repository only as a text layout core. All MagMark-specific behavior lives inside this app:

- import Markdown
- compose social-media cards or long images
- export high-resolution PNG files

## Isolation model

There is only one integration point with the parent repository:
- `src/adapters/pretext.ts`

That adapter is the only place that calls:
- `prepareWithSegments()`
- `layoutNextLine()`

Everything else stays local to the standalone app:
- Markdown parsing
- themes and presets
- block composition and pagination
- canvas rendering
- PNG export
- UI state and controls

## Structure

- `index.html`: standalone entry
- `src/main.ts`: UI state, events, export flow
- `src/adapters/pretext.ts`: only Pretext adapter
- `src/markdown/parser.ts`: Markdown parsing
- `src/layout/compose.ts`: block layout, pagination, long-image composition
- `src/render/canvas.ts`: Canvas rendering
- `src/export/png.ts`: PNG export helpers
- `src/themes/catalog.ts`: presets and themes
- `src/domain/types.ts`: shared types

## Features

- reuses the repository `src/layout.ts` line layout logic
- uses `prepareWithSegments()` and `layoutNextLine()` for real line breaking
- supports headings, paragraphs, quotes, lists, code blocks, dividers, and image placeholders
- supports `1080 x 1440` social card pagination
- supports `1080 x auto` long-image output
- supports `2x / 3x / 4x` PNG export

## Run

```sh
cd magic-magmark
npm install
npm run dev
```

Default local URL:

```txt
http://127.0.0.1:4173
```

If you start from the repository root:

```sh
bun start
```

Then open:

```txt
http://127.0.0.1:3000/magic-magmark
```

## Pipeline

1. Parse Markdown into lightweight content blocks.
2. Convert each block into styled inline spans.
3. Send text to `src/adapters/pretext.ts`.
4. Use `prepareWithSegments()` and `layoutNextLine()` to compute wrapped lines.
5. Compose those lines into paragraphs, quotes, lists, and pages in `src/layout/compose.ts`.
6. Paginate fixed-height social cards or accumulate height for a long image.
7. Render the final geometry to Canvas.
8. Export Canvas as PNG.

## Current limits

- Markdown images are placeholders for now and are not drawn from local files
- WeChat embedded HTML composition is intentionally not implemented
- the current focus is layout fidelity plus image export
