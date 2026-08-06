# Contributing to htmlpdfx

Thanks for taking the time. This is a small project, so the process is light —
but the test suite is the point of it, so please read the "Adding a capability"
section before opening a PR.

## Getting set up

Requires **Node ≥ 18** (Bun also works).

```bash
git clone https://github.com/pratik227/htmlpdfx.git
cd htmlpdfx
npm ci
npm run build
```

Playwright browsers are only needed for the browser and e2e suites:

```bash
npx playwright install --with-deps chromium firefox webkit
```

## The checks

Run these before pushing. CI runs all of them, on Ubuntu + Windows + macOS
across Node 18/20/22 and again under Bun — so a failure here is a failure
everywhere.

```bash
npm run typecheck          # tsc --noEmit; the repo is strict, keep it clean
npm test                   # unit + behavior suite (fast, no browser needed)
npm run test:browser       # canvas engine in Chromium, Firefox, WebKit
npm run test:e2e           # assert on a real Chromium-produced PDF
npm run test:browser-download  # drive the examples, assert a PDF downloads
npm run docs:build         # docs must build
npm run docs:check-links   # and every internal link must resolve
```

The unit suite is deliberately engine-agnostic and runs in a few seconds with
no browser installed. Keep it that way — anything needing a real browser
belongs in `test/e2e.mjs` or `test/cross-browser.mjs`.

## Project layout

```
src/core/      option normalization, input resolution, pagination, templating
src/engine/    engine selection + the chromium and canvas engines
src/pdf/       the from-scratch PDF writer and byte helpers
src/dom/       the from-scratch DOM rasterizer (SVG foreignObject)
src/server/    warm-browser renderer pooling
src/react.ts   framework adapters (SSR -> engine)
src/vue.ts
```

`docs/guide/architecture.md` walks the render pipeline end to end. Read it
before changing anything in `src/core/` or `src/pdf/`.

## Hard constraints

These are not negotiable, and a PR that breaks one will not be merged:

1. **No `jspdf` and no `html2canvas`.** The PDF writer and the DOM rasterizer
   are written from scratch, on purpose. Chromium drivers
   (puppeteer / playwright) are the only permitted heavy dependencies, and they
   stay optional and server-side.
2. **No required runtime dependencies.** If you need a helper, write it.
3. **One API across Node, Bun, and the browser.** Nothing may assume a DOM on
   the server, and nothing may assume `process` in the browser. Use
   `detectRuntime()`.
4. **Cross-browser means Chromium *and* Firefox *and* WebKit.** Safari counts.
5. **Errors are typed.** Throw `HtmlPdfxError` with a stable code — never let a
   raw driver error escape to the caller.

## Adding a capability

Anything user-visible needs three things in the same PR:

1. **A test that fails without your change.** Behavioural guarantees (page
   breaks, blank pages, atomic blocks, units, escaping) go in
   `test/behavior.test.ts`. Guarantees about the *produced PDF* go in
   `test/e2e.mjs`, asserted against real bytes.
2. **A row in the capability matrix** — both `docs/capabilities.md` and the
   programmatic `engineCapabilities` in `src/*/capabilities.ts`. The two must
   agree, and each tier must be marked honestly: `⚠️` and `❌` are useful
   information, and overstating the canvas tier is worse than admitting a gap.
3. **A `CHANGELOG.md` entry** under `## [Unreleased]`.

## Writing docs

The docs site is VitePress with a custom theme in `docs/.vitepress/theme/`.
These components are registered globally, so use them in any page without an
import:

| Component                       | For                                                      |
| ------------------------------- | -------------------------------------------------------- |
| `<Callout type="note\|tip\|warning\|danger">` | An aside worth breaking the flow for      |
| `<CardGroup :cols="2">` + `<Card>` | A set of links or points read in any order            |
| `<Steps>` + `<Step title="…">`  | A genuine sequence — install, then configure, then render |
| `<EngineBadge engine="chromium">` | Marking which tier a passage is about                  |
| `<TierMark level="full\|partial\|none">` | A single support mark                            |
| `<CapabilityMatrix />`          | The full matrix, from `.vitepress/data/capabilities.ts`   |

Two things that will bite you:

1. **Leave a blank line inside a component's slot.** Without one, markdown-it
   swallows the whole block as raw HTML — your markdown won't render, and any
   inline `` `<tag>` `` becomes a real unclosed tag that fails the build.
2. **Icons are referenced by role, not by Solar name.** Add new ones to `ICONS`
   in `docs/.vitepress/icons.ts` (browse at
   [icon-sets.iconify.design/solar](https://icon-sets.iconify.design/solar/));
   an unknown name throws at build time rather than rendering nothing.

Colour in the docs means engine-tier support — green works, amber is best
effort, grey is unsupported — plus warning and danger callouts. Don't introduce
a decorative colour; the design leans on spacing and type instead.

The first paragraph after the `#` title is styled as the page's lead
automatically, so give every page one sentence saying what it's for.

## Reporting a bug

Include the htmlpdfx version, the engine (`chromium` or `canvas`), the runtime
and OS, and a minimal HTML + options pair that reproduces it. A produced PDF
attached to the issue helps a lot.

For anything security-related, do **not** open an issue — see
[SECURITY.md](SECURITY.md).

## Commits and PRs

- Imperative subject lines ("Add outline support", not "Added" or "Adds"), and
  a body explaining *why* when it isn't obvious.
- Keep a PR to one concern.
- Say in the PR description which of the checks above you ran locally.

## Releasing

Maintainers only — see the "Publishing" section of
[`.github/workflows/release.yml`](.github/workflows/release.yml). In short: bump
the version, move the `Unreleased` changelog entries under the new version, tag
`vX.Y.Z`, and push the tag. CI verifies and publishes to npm with provenance.

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
