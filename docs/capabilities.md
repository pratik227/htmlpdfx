# Capabilities

htmlpdfx has **two rendering tiers**, and they are deliberately *not* equal.
Knowing which one you're on is the difference between "my PDF matches my
webpage" and "close enough."

## The two tiers

### 🟢 Chromium engine — high fidelity (recommended)

The browser's own print-to-PDF, via Puppeteer (bundled) or Playwright. **The
PDF _is_ the webpage**, rendered by the same engine — so page breaks, fonts,
CSS, and layout are correct by construction. Runs on Node, Bun, and Deno.

This is the tier you want for anything user-facing. It's the default whenever a
Chromium driver is available.

### 🟡 Canvas engine — best effort (fallback)

A zero-dependency DOM rasterizer for the browser when Chromium isn't available.
It produces a faithful *screenshot* of your DOM, sliced cleanly across pages —
but it is a raster, not a reflow. Use it as graceful degradation, not as a
replacement for the real engine.

## What each tier supports

| Capability | 🟢 Chromium | 🟡 Canvas | Notes |
|---|:--:|:--:|---|
| **Selectable / searchable text** | ✅ | ❌ | Canvas rasterizes body text into the page image |
| **Vector graphics (crisp at any zoom)** | ✅ | ❌ | Canvas embeds a raster image |
| **Clickable links (`<a href>`)** | ✅ | ❌ | Flattened in the canvas tier |
| **Native CSS page breaks (`break-*`, `@page`)** | ✅ | ⚠️ | Canvas uses a measured slicer, not a layout engine |
| **Repeating table headers (`<thead>`)** | ✅ | ❌ | Free in Chromium via `table-header-group` |
| **Smart pagination defaults** | ✅ | ⚠️ | Injected print-CSS; canvas honors what it can |
| **No split rows / figures / images** | ✅ | ✅ | Both keep atomic blocks whole |
| **No blank pages** | ✅ | ✅ | Exactly `ceil(content / page)` |
| **Full modern CSS (grid, flexbox, `oklch()`)** | ✅ | ⚠️ | Canvas depends on the browser's `foreignObject` support |
| **Web fonts** | ✅ | ✅ | `document.fonts.ready` awaited; embedded |
| **Background colors** | ✅ | ✅ | `print-color-adjust: exact` |
| **Headers & footers (`{{page}}`/`{{pages}}`)** | ✅ | ✅ | Selectable in Chromium; rasterized in canvas |
| **Page size & orientation** | ✅ | ✅ | Never auto-flipped |
| **RTL / bidi text** | ✅ | ⚠️ | Chromium uses the real bidi engine |
| **Unicode / i18n** | ✅ | ✅ | Any glyph; PDF strings safely escaped |
| **Configurable DPI / scale** | ✅ | ✅ | Canvas defaults to 2× device scale |
| **Runs server-side (headless)** | ✅ | ❌ | Canvas needs a DOM |
| **Zero install** | ❌¹ | ✅ | ¹ puppeteer ships as an optional dependency |

✅ supported · ⚠️ partial / best-effort · ❌ not supported

> **Rule of thumb:** if the output is for a human (invoices, reports, tickets),
> use the Chromium tier. The canvas tier exists so a browser-only build still
> produces *something* when Chromium can't run.

## Inspect tiers in code

The same matrix is available programmatically, so you can branch or warn at
runtime:

```ts
import { engineCapabilities, describeEngines } from "htmlpdfx";

engineCapabilities.chromium.selectableText; // true
engineCapabilities.canvas.tier;             // "best-effort"
describeEngines();                          // one-line summary
```

## Roadmap

Documented limitations, not yet implemented:

- **Interactive form fields** (AcroForm widgets).
- **Password / encryption** (user/owner passwords, permission flags).
- **Browser `<PdfExport>` component** for client-side React/Vue export.

## Run the checks

```bash
npm test             # full unit + behavior suite
npm run test:browser # Chromium + Firefox + WebKit rendering
```
