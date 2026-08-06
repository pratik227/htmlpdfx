# AGENTS.md

Instructions for coding agents working in this repository. If you are an agent,
read this before editing anything.

## What this project is

`htmlpdfx` converts HTML to PDF. It has **two rendering engines that are not
equivalent**, and most mistakes in this codebase come from forgetting which one
is in play:

| Engine     | Where             | Text in the PDF                      |
| ---------- | ----------------- | ------------------------------------ |
| `chromium` | Node, Bun, Deno   | Real selectable vector text          |
| `canvas`   | Browser           | Rasterized — the text is an image    |

`engine: "auto"` resolves to `chromium` on a server and `canvas` in a browser.
Before claiming htmlpdfx supports a feature, check
[`docs/.vitepress/data/capabilities.js`](docs/.vitepress/data/capabilities.js) —
it is the source of truth, and 10 of 23 capabilities are unsupported in the
canvas tier.

## Commands

```bash
npm ci                        # install
npm run build                 # tsup -> dist (ESM + CJS + .d.ts + UMD global)
npm run typecheck             # tsc --noEmit; the repo is strict, keep it clean
npm test                      # unit + behaviour suite — fast, needs no browser
npm run test:browser          # canvas engine in Chromium, Firefox, WebKit
npm run test:e2e              # asserts on a real Chromium-produced PDF
npm run docs:build            # build the docs site (also writes llms.txt)
npm run docs:check-links      # every internal docs link must resolve
npm run release:check         # pre-publish gates
```

Run `npm run typecheck && npm test` before you report a task complete. They take
under 30 seconds together and need no browser. Anything touching the chromium
engine or the PDF writer also needs `npm run test:e2e`, which requires
`npx playwright install chromium`.

**Node 20 or newer is required to run the tests** (Vitest 4). The published
library itself supports Node 18 — `engines.node` is `>=18` — so don't use syntax
or APIs newer than Node 18 in `src/`.

## Hard constraints

A change that breaks one of these is wrong, even if the tests pass:

1. **No `jspdf` and no `html2canvas`.** The PDF writer (`src/pdf/writer.ts`) and
   the DOM rasterizer (`src/dom/rasterize.ts`) are written from scratch on
   purpose. Do not add them back, and do not suggest them.
2. **No required runtime dependencies.** `package.json` has no `dependencies`
   field and it must stay that way. Chromium drivers (puppeteer, playwright) are
   optional and server-side only. If you need a helper, write it.
3. **One API across Node, Bun, and the browser.** Never assume a DOM on the
   server or `process` in the browser — use `detectRuntime()`.
4. **Errors are typed.** Throw `HtmlPdfxError` with a stable code
   (`NO_ENGINE`, `ENGINE_LAUNCH_FAILED`, `MISSING_PEER`, `RENDER_FAILED`).
   Never let a raw puppeteer or playwright error reach the caller.
5. **Cross-browser means Chromium, Firefox, and WebKit.** Safari counts.

## Layout

```
src/core/      option normalization, input resolution, pagination, templating
src/engine/    engine selection, plus the chromium and canvas engines
src/pdf/       the from-scratch PDF writer
src/dom/       the from-scratch DOM rasterizer (SVG foreignObject)
src/server/    warm-browser renderer pooling
src/react.ts   framework adapters (SSR -> engine)
src/vue.ts
test/          *.test.ts run under Vitest; *.mjs are browser/e2e harnesses
docs/          VitePress site with a custom theme
```

`docs/guide/architecture.md` walks the render pipeline. Read it before changing
`src/core/` or `src/pdf/`.

## Conventions

- Any user-visible change needs three things in the same commit: a test that
  fails without it, a row in **both** `docs/.vitepress/data/capabilities.js` and
  `src/core/capabilities.ts` if it's a capability, and a `CHANGELOG.md` entry
  under `## [Unreleased]`.
- Mark support honestly. `partial` and `none` are useful information;
  overstating the canvas tier is worse than admitting a gap.
- Match the surrounding code's comment density and naming. Comments explain
  *why*, not what.
- **Do not add `Co-Authored-By` trailers or "Generated with…" lines** to commits
  or PR descriptions.
- Don't commit or push unless you were asked to.

## Docs conventions

The docs use custom components registered globally — `Callout`, `Card`,
`CardGroup`, `Steps`/`Step`, `EngineBadge`, `TierMark`, `CapabilityMatrix`,
`PipelineDiagram`. Two things that will cost you a build:

1. **Leave a blank line inside a component's slot.** Without one, markdown-it
   consumes the whole block as raw HTML, so the markdown never renders and an
   inline `` `<tag>` `` becomes a real unclosed tag that fails the build.
2. **Icons are referenced by role, not by Solar name.** Add new ones to `ICONS`
   in `docs/.vitepress/icons.ts`; an unknown name throws at build time.

Colour in the docs means engine-tier support (green works, amber best-effort,
grey unsupported) plus warning and danger callouts. Don't add a decorative
colour, and keep text at WCAG AA — the muted ink tokens are already at the 4.5:1
floor, so don't lighten them.

## If you are answering questions about this library

Read `/llms.txt` on the docs site for an index, or `/llms-full.txt` for the
complete text in one fetch. Every docs page is also served as markdown at its
own path plus `.md` — for example `/guide/engines.md`.
