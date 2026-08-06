# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Documentation site redesign.** A custom VitePress theme with a monochrome
  design system, Solar icons (Iconify, inlined at build time — nothing is
  fetched at runtime), and purpose-built components: `CapabilityMatrix`,
  `EngineBadge`, `TierMark`, `Callout`, `Card`/`CardGroup`, `Steps`/`Step`.
  Colour is reserved for engine-tier support, so any colour on the page is
  carrying information rather than decorating it.
- The capability matrix is now generated from
  `docs/.vitepress/data/capabilities.ts`, with per-engine tallies computed from
  the data — so the page can't claim more support than the matrix states.

## [1.0.0] — 2026-08-06

First public release. Starting at 1.0.0 rather than 0.x is deliberate: the API
below is verified end to end against real produced PDFs on every supported OS,
runtime, and browser engine (see **Verified**), and is considered stable. From
here, breaking changes require a major bump.

### Added

- **Unified `toPdf()` API** across Node, Bun, and the browser, plus a fluent
  `htmlpdfx()` builder that is drop-in compatible with html2pdf.js
  (`html2pdf` is exported as an alias).
- **Two rendering tiers, explicitly documented.** A high-fidelity `chromium`
  engine (Puppeteer or Playwright) for selectable vector text, real CSS, and
  native page breaks; and a `canvas` engine for browser-only builds. `auto`
  picks per runtime — chromium on the server, canvas in the browser.
- **Zero required runtime dependencies.** The PDF writer (`src/pdf/writer.ts`)
  and the DOM rasterizer (`src/dom/rasterize.ts`, SVG `foreignObject`) are
  written from scratch — no `jspdf`, no `html2canvas`. Puppeteer ships as an
  optional dependency; `puppeteer-core` / `playwright` / `playwright-core` are
  auto-detected if present.
- **Smart pagination** — honours CSS `break-before` / `break-after` /
  `break-inside`, plus a measured slicer that backs up to the top of an atomic
  block rather than cutting through a table row, card, or figure. Produces
  exactly `ceil(content / page)` pages, so no trailing blank page.
- **Headers & footers** with `{{page}}`, `{{pages}}`, and `{{title}}` tokens,
  rendered as real selectable text in the chromium tier.
- **Outline / bookmarks** generated from heading structure
  (`chromium: { outline: true }`), and tagged (PDF/UA) output on by default in
  the chromium tier.
- **Warm-browser pooling** via `createRenderer()` for server throughput —
  the browser stays open between renders.
- **Framework adapters** — `htmlpdfx/react` and `htmlpdfx/vue` render a
  component through SSR and hand the markup to the engine.
- **Bundler-free browser use** — a UMD/IIFE global build (`htmlpdfx/global`,
  wired to `unpkg`/`jsdelivr`) exposing `window.htmlpdfx`, plus ESM straight
  from a CDN.
- **Typed errors** — `HtmlPdfxError` with stable codes (`NO_ENGINE`,
  `ENGINE_LAUNCH_FAILED`, `MISSING_PEER`, `RENDER_FAILED`, …) instead of
  leaking driver internals.
- **Runtime capability matrix** — `engineCapabilities` and `describeEngines()`
  expose per-tier support programmatically, so callers can branch or warn.
- **Cross-browser handling** — WebP-to-JPEG fallback for Safari's canvas
  export, and a tainted-canvas guard that raises an actionable `RENDER_FAILED`
  rather than a cryptic `SecurityError`.

### Verified

- Unit + behavior suite on Ubuntu, Windows, and macOS across Node 18/20/22,
  and again under Bun.
- Browser rendering through Playwright in Chromium, Firefox, and WebKit.
- End-to-end assertions against a real Chromium-produced PDF: page count,
  extractable text, repeating `<thead>`, link annotations, navigable outline,
  and renderer pooling.
- Every internal docs link resolved by a Playwright crawler in CI.

### Known limitations

Tracked on the [capabilities page](docs/capabilities.md) and not implemented
in 1.0.0. These are additive, so they can land in a 1.x minor:

- Interactive form fields (AcroForm widgets).
- Password / encryption (user & owner passwords, permission flags).
- A browser `<PdfExport>` component for client-side React/Vue export.

[Unreleased]: https://github.com/pratik227/htmlpdfx/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/pratik227/htmlpdfx/releases/tag/v1.0.0
